/**
 * Capture-rate reconciliation (Pillar 4).
 *
 * Pulls pageview counts from three independent sources and computes the
 * ratios between them. The ratios tell us whether the client-side telemetry
 * is actually capturing the traffic Cloudflare sees:
 *
 *   CF Web Analytics (RUM beacon) → ground-truth-ish, matches what users see
 *   Workers Analytics Engine      → Pillar 1 — server-side, should match CF ±5%
 *   D1 client events              → Pillar 2 — the number we want to be ≥70%
 *
 * The three sources use different CF APIs:
 *   - CF Web Analytics is only exposed via the GraphQL Analytics API
 *   - Analytics Engine has its own SQL API
 *   - D1 is pulled by the existing `pullTelemetryData` script
 *
 * If any source returns an error, the ratio for that pair is reported as
 * `null` and the report notes which source failed. We do not throw — the
 * reconciliation is a health check, not a critical path.
 */

import { HUMAN_BOT_SCORE_THRESHOLD, NON_HUMAN_CLIENT_CLASSES } from '../../worker/human-classification';

const ACCOUNT_ID = 'ea158eac6035716195ee97831b85562c';
const AE_DATASET = 'jsonexport_pageviews';

/** SQL list literal for the client classes looksHuman() rejects. */
export const NON_HUMAN_SQL_LIST = NON_HUMAN_CLIENT_CLASSES.map(c => `'${c}'`).join(', ');
const WEB_ANALYTICS_SITE_TAG = 'cf7c385cfd434867b78284cb63af585a';

export interface CaptureRateReport {
    window: { startIso: string; endIso: string; hours: number };
    sources: {
        cfWebAnalytics: { pageviews: number | null; error?: string };
        // Analytics Engine returns both the raw count (all HTML HTTP GETs
        // the edge worker saw, including bots + prefetches + link previews)
        // and a "human-looking" subset (CF bot score + UA class filtered).
        // Only the human-looking number is comparable to CF RUM.
        analyticsEngine: {
            pageviews: number | null;
            pageviewsRawAllHtml?: number | null;
            /** Rows carrying the fixed (v2) column semantics. Only these are
             *  classifiable; see the SQL comment for why. */
            pageviewsSchemaV2?: number | null;
            error?: string;
        };
        // D1 now carries two kinds of page_view events:
        //   client — fired by the webview beacon (blocked by uBlock etc.)
        //   edge   — fired by the edge worker as a fallback for blocked users
        // unionEstimate is the deduped total we compare to CF RUM.
        d1Client: {
            pageviews: number | null;
            pageviewsClientBeacon?: number | null;
            pageviewsEdgeFallback?: number | null;
            /** Deduped by (hour, path, country). Kept for reference only —
             *  it collapses genuine repeat visits, so it is a lower bound and
             *  not comparable to CF RUM's undeduped count. */
            pageviewsDedupedUnion?: number | null;
            error?: string;
        };
    };
    ratios: {
        pillar1_vs_cf: number | null;  // human-filtered AE / CF RUM — should be ~1.0
        pillar2_vs_cf: number | null;  // D1 union-estimate / CF RUM
        /** Share of captured pageviews that came from the edge fallback
         *  rather than a client beacon — a floor on blocker suppression, not
         *  an exact rate. See the derivation for why an exact figure is not
         *  available without a shared request id. */
        clientBlockerSuppression: number | null;
    };
    verdict: 'healthy' | 'degraded' | 'unknown';
    notes: string[];
}

interface Env {
    cfApiToken: string;
}

function readToken(): string | null {
    // Try explicit env first, fall back to wrangler's cached oauth token.
    const envTok = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
    if (envTok) return envTok;
    try {
        const os = require('os');
        const fs = require('fs');
        const p = `${os.homedir()}/.wrangler/config/default.toml`;
        const content = fs.readFileSync(p, 'utf8');
        const m = content.match(/^oauth_token\s*=\s*"([^"]+)"/m);
        return m ? m[1] : null;
    } catch {
        return null;
    }
}

async function fetchCfWebAnalytics(env: Env, startIso: string, endIso: string): Promise<number> {
    // CF Web Analytics is exposed via the GraphQL Analytics API.
    // Dataset: rumPageloadEventsAdaptiveGroups.
    const query = `
      query PageviewsByDay($accountTag: string!, $siteTag: string!, $start: Time!, $end: Time!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            rumPageloadEventsAdaptiveGroups(
              filter: { siteTag: $siteTag, datetime_geq: $start, datetime_leq: $end }
              limit: 10000
            ) {
              count
            }
          }
        }
      }
    `;
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.cfApiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: { accountTag: ACCOUNT_ID, siteTag: WEB_ANALYTICS_SITE_TAG, start: startIso, end: endIso },
        }),
    });
    if (!res.ok) throw new Error(`CF Web Analytics HTTP ${res.status}`);
    const body: any = await res.json();
    if (body.errors) throw new Error(`CF Web Analytics GraphQL: ${JSON.stringify(body.errors)}`);
    const groups = body?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
    return groups.reduce((sum: number, g: any) => sum + (g.count || 0), 0);
}

interface AePageviewCounts {
    /** Raw count — all HTML HTTP GETs the edge worker saw. */
    raw: number;
    /** Rows written with the fixed (v2) column semantics. Only these can be
     *  classified; pre-fix rows had a hardcoded bot score. */
    schemaV2: number;
    /** Human-looking subset of the v2 rows — mirrors looksHuman(). */
    humanLike: number;
}

async function fetchAnalyticsEnginePageviews(
    env: Env,
    startIso: string,
    endIso: string
): Promise<AePageviewCounts> {
    // Bot filtering mirrors `looksHuman()` in worker/edge-worker.ts, built
    // from the same exported constants so the two cannot drift.
    //
    // Column meanings (schema v2, double4 = 2):
    //   double2 = bot score: 0 = unscored, 1..99 = score (1 bot, 99 human)
    //   double3 = scoreSource: 0 UNSCORED | 1 CF_SCORED | 2 VERIFIED_BOT
    //   double4 = row schema version
    //   blob4   = uaClass from the UA regex
    //
    // A row is human-looking when:
    //   scoreSource = 1 (CF_SCORED)   AND double2 >= 30
    //   scoreSource = 0 (UNSCORED)    AND blob4 NOT IN NON_HUMAN_CLIENT_CLASSES
    //   scoreSource = 2 (VERIFIED_BOT) -> never human
    //
    // Rows written before 2026-10-10 carry no double3/double4 (both read back
    // as 0) and a double2 that was hardcoded to 1 for EVERY request by the
    // verifiedBotCategory bug. Those rows cannot be reclassified after the
    // fact — double2 = 1 is indistinguishable from a genuine "definitely bot".
    // We therefore exclude pre-v2 rows from the human count entirely and
    // report them separately rather than silently scoring them as bots.
    const tsFrom = startIso.replace('T', ' ').replace(/\.\d+Z$/, '');
    const tsTo = endIso.replace('T', ' ').replace(/\.\d+Z$/, '');
    const sql = `
      SELECT
        SUM(_sample_interval) AS raw,
        SUMIf(_sample_interval, double4 >= 2) AS schema_v2,
        SUMIf(
          _sample_interval,
          double4 >= 2
          AND (
            (double3 = 1 AND double2 >= ${HUMAN_BOT_SCORE_THRESHOLD})
            OR (double3 = 0 AND blob4 NOT IN (${NON_HUMAN_SQL_LIST}))
          )
        ) AS human_like
      FROM ${AE_DATASET}
      WHERE timestamp >= toDateTime('${tsFrom}')
        AND timestamp <  toDateTime('${tsTo}')
      FORMAT JSON
    `.trim();
    const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.cfApiToken}`,
                'Content-Type': 'text/plain',
            },
            body: sql,
        }
    );
    if (!res.ok) throw new Error(`Analytics Engine HTTP ${res.status}`);
    const body: any = await res.json();
    const row = body?.data?.[0] || {};
    const raw = Number(row.raw || 0);
    const schemaV2 = Number(row.schema_v2 || 0);
    const humanLike = Number(row.human_like || 0);
    if (!Number.isFinite(raw) || !Number.isFinite(humanLike) || !Number.isFinite(schemaV2)) {
        throw new Error('Analytics Engine returned non-numeric');
    }
    return { raw, schemaV2, humanLike };
}

interface D1PageviewCounts {
    /** Client-side beacon pageviews (event_name='page_view'). */
    client: number;
    /** Server-side fallback pageviews fired by the edge worker
     *  (event_name='page_view_edge'). Catches users whose client beacon
     *  was blocked by uBlock / Brave Shields / iOS ITP / NoScript. */
    edge: number;
    /** Backward-compat: client + edge, deduped by (hour, path, country) so
     *  a user whose client beacon fired *and* was seen by the edge isn't
     *  double-counted. Approximation — not perfectly deduped — but good
     *  enough to compare against CF RUM. */
    unionEstimate: number;
}

async function fetchD1Pageviews(startMs: number, endMs: number): Promise<D1PageviewCounts> {
    const fs = require('fs');
    const path = require('path');
    const file = path.resolve(process.cwd(), 'performance_data/telemetry_latest.json');
    if (!fs.existsSync(file)) throw new Error('telemetry_latest.json missing (run `npm run telemetry:pull` first)');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const events = data.events || [];
    const inWindow = (e: any) => e.timestamp >= startMs && e.timestamp < endMs;

    const client = events.filter((e: any) =>
        e.event_name === 'page_view' && inWindow(e)
    ).length;
    const edge = events.filter((e: any) =>
        e.event_name === 'page_view_edge' && inWindow(e)
    ).length;

    // Dedupe union by hour-bucket + path + country. Each tuple represents
    // one plausible user session for that page. Rough but defensible.
    const seen = new Set<string>();
    for (const e of events) {
        if (!inWindow(e)) continue;
        if (e.event_name !== 'page_view' && e.event_name !== 'page_view_edge') continue;
        const hour = Math.floor(e.timestamp / (60 * 60 * 1000));
        const key = `${hour}|${e.path || ''}|${e.country || ''}`;
        seen.add(key);
    }
    return { client, edge, unionEstimate: seen.size };
}

export async function computeCaptureRate(windowHours = 24): Promise<CaptureRateReport> {
    const now = Date.now();
    const startMs = now - windowHours * 3_600_000;
    const startIso = new Date(startMs).toISOString();
    const endIso = new Date(now).toISOString();
    const notes: string[] = [];

    const token = readToken();
    if (!token) {
        return {
            window: { startIso, endIso, hours: windowHours },
            sources: {
                cfWebAnalytics: { pageviews: null, error: 'no CF API token available' },
                analyticsEngine: { pageviews: null, error: 'no CF API token available' },
                d1Client: { pageviews: null },
            },
            ratios: { pillar1_vs_cf: null, pillar2_vs_cf: null, clientBlockerSuppression: null },
            verdict: 'unknown',
            notes: ['Set CLOUDFLARE_API_TOKEN or run `wrangler login` first.'],
        };
    }
    const env: Env = { cfApiToken: token };

    const [cfRes, aeRes, d1Res] = await Promise.allSettled([
        fetchCfWebAnalytics(env, startIso, endIso),
        fetchAnalyticsEnginePageviews(env, startIso, endIso),
        fetchD1Pageviews(startMs, now),
    ]);

    const cf = cfRes.status === 'fulfilled'
        ? { pageviews: cfRes.value }
        : { pageviews: null, error: String(cfRes.reason).slice(0, 200) };
    const ae = aeRes.status === 'fulfilled'
        ? {
            pageviews: aeRes.value.humanLike,
            pageviewsRawAllHtml: aeRes.value.raw,
            pageviewsSchemaV2: aeRes.value.schemaV2,
        }
        : { pageviews: null, pageviewsRawAllHtml: null, pageviewsSchemaV2: null, error: String(aeRes.reason).slice(0, 200) };
    const d1 = d1Res.status === 'fulfilled'
        ? {
            // Pillar 2 is reported as the CLIENT BEACON rate, because that is
            // what the 70% SLO is about and what CF RUM is comparable to:
            // both count individual pageloads.
            //
            // The old headline was `unionEstimate`, deduped by
            // (hour, path, country). That collapses genuine repeat visits —
            // 53 client beacons plus 9 edge writes reported as 27 — so it was
            // compared against CF's undeduped count and understated capture.
            pageviews: d1Res.value.client,
            pageviewsClientBeacon: d1Res.value.client,
            pageviewsEdgeFallback: d1Res.value.edge,
            pageviewsDedupedUnion: d1Res.value.unionEstimate,
        }
        : { pageviews: null, pageviewsClientBeacon: null, pageviewsEdgeFallback: null, pageviewsDedupedUnion: null, error: String(d1Res.reason).slice(0, 200) };

    const ratio = (num: number | null, denom: number | null) =>
        (num == null || denom == null || denom === 0) ? null : num / denom;

    // Pillar 1 ratio uses the human-filtered AE count. The raw count
    // (bots + prefetch + previews included) is shown separately in the
    // report so bot-traffic spikes stay visible.
    const pillar1 = ratio(ae.pageviews, cf.pageviews);
    const pillar2 = ratio(d1.pageviews, cf.pageviews);

    // Blocker suppression: 1 - (client / edge). Only meaningful once edge
    // writes have accumulated — if edge == 0 we don't have the fallback
    // signal yet (either worker not deployed or the window is too fresh).
    // Share of captured pageviews that only the edge fallback saw.
    //
    // The previous formula was `1 - client / edge`, which assumes the edge
    // observed a superset of what the client did. It does not: the edge only
    // writes for human-looking requests and only since it was deployed, while
    // client beacons accumulate across the whole window. With 53 client
    // beacons against 9 edge writes that produced "-488.9% suppression".
    //
    // This cannot be an exact blocked-user rate without a shared request id —
    // edge rows carry no beacon id to join on. It is an honest floor: the
    // proportion of what we captured that came from the fallback path.
    const totalCaptured =
        (d1.pageviewsClientBeacon ?? 0) + (d1.pageviewsEdgeFallback ?? 0);
    const clientBlockerSuppression =
        d1.pageviewsEdgeFallback != null && d1.pageviewsEdgeFallback > 0 && totalCaptured > 0
            ? d1.pageviewsEdgeFallback / totalCaptured
            : null;

    let verdict: CaptureRateReport['verdict'] = 'unknown';
    if (cf.pageviews != null && d1.pageviews != null) {
        if (pillar2 != null && pillar2 >= 0.70) verdict = 'healthy';
        else verdict = 'degraded';
    }

    // Alert thresholds tightened to avoid noise in low-traffic windows:
    //   - Pillar 1 must be <0.5x or >2x CF RUM AND volume > 50 to warn
    //   - Bot share > 60% is its own warning
    // Pre-fix rows are unclassifiable (see the SQL comment). While they still
    // dominate the window, a low Pillar 1 says nothing about the worker — it
    // just means the fixed worker has not been live long enough. Report that
    // plainly instead of raising a false alarm about isHtmlPageRequest.
    const v2Share =
        ae.pageviewsRawAllHtml != null && ae.pageviewsRawAllHtml > 0 && ae.pageviewsSchemaV2 != null
            ? ae.pageviewsSchemaV2 / ae.pageviewsRawAllHtml
            : null;
    const v2Dominant = v2Share != null && v2Share >= 0.8;

    if (v2Share != null && v2Share < 0.8) {
        notes.push(
            `${((1 - v2Share) * 100).toFixed(0)}% of Analytics Engine rows in this window predate the 2026-10-10 bot-score fix and carry a hardcoded score of 1. They are excluded from the human count rather than miscounted as bots, so Pillar 1 reads low until the window rolls forward. Not a live defect.`
        );
    }
    if (
        v2Dominant &&
        cf.pageviews != null &&
        ae.pageviews != null &&
        cf.pageviews > 50 &&
        pillar1 != null &&
        (pillar1 < 0.5 || pillar1 > 2.0)
    ) {
        notes.push(
            `Pillar 1 (human-filtered AE) is ${(pillar1 * 100).toFixed(1)}% of CF RUM — expected 70-130%. Check edge worker's isHtmlPageRequest heuristic.`
        );
    }
    if (
        v2Dominant &&
        ae.pageviewsRawAllHtml != null &&
        ae.pageviews != null &&
        ae.pageviewsRawAllHtml > 100
    ) {
        const botShare = 1 - ae.pageviews / ae.pageviewsRawAllHtml;
        if (botShare > 0.6) {
            notes.push(
                `Bot/automated traffic is ${(botShare * 100).toFixed(0)}% of edge HTML requests. Not a bug — informational.`
            );
        }
    }
    if (pillar2 != null && pillar2 < 0.70) {
        notes.push(
            `Pillar 2 (client beacons) is ${(pillar2 * 100).toFixed(1)}% of CF RUM — below the 70% SLO. ` +
            (d1.pageviewsEdgeFallback && d1.pageviewsEdgeFallback > 0
                ? `The edge fallback is live and already recovering ${d1.pageviewsEdgeFallback} pageview(s) the client beacon missed. Remaining gap is content blockers (uBlock, Brave Shields, iOS ITP) on requests the edge also could not attribute.`
                : `The edge fallback has written nothing in this window — check that the worker is deployed and that looksHuman() is not rejecting real traffic, which is exactly what the 2026-10-10 bot-score defect did.`)
        );
    }
    if (cf.pageviews === 0) {
        notes.push('CF Web Analytics returned 0 pageviews for this window — may indicate a reporting lag; retry later.');
    }

    return {
        window: { startIso, endIso, hours: windowHours },
        sources: { cfWebAnalytics: cf, analyticsEngine: ae, d1Client: d1 },
        ratios: {
            pillar1_vs_cf: pillar1,
            pillar2_vs_cf: pillar2,
            clientBlockerSuppression,
        },
        verdict,
        notes,
    };
}

export function formatCaptureRateSection(report: CaptureRateReport): string {
    const fmtNum = (n: number | null) => n == null ? 'n/a' : n.toLocaleString();
    const fmtPct = (r: number | null) => r == null ? 'n/a' : `${(r * 100).toFixed(1)}%`;
    const lines: string[] = [];
    lines.push('');
    lines.push('┌───────────────────────────────────────────────────────────────────┐');
    lines.push('│ 6. CAPTURE-RATE RECONCILIATION — telemetry health check            │');
    lines.push('└───────────────────────────────────────────────────────────────────┘');
    lines.push(`• Window:  ${report.window.hours}h  (${report.window.startIso} → ${report.window.endIso})`);
    lines.push(`• CF Web Analytics (RUM):      ${fmtNum(report.sources.cfWebAnalytics.pageviews)} pageviews (JS-only, real users)`);
    const rawAllHtml = report.sources.analyticsEngine.pageviewsRawAllHtml;
    lines.push(`• Pillar 1 (Analytics Engine): ${fmtNum(report.sources.analyticsEngine.pageviews)} human-looking pageviews  (${fmtPct(report.ratios.pillar1_vs_cf)} of CF)`);
    if (rawAllHtml != null) {
        lines.push(`    ↳ ${fmtNum(rawAllHtml)} raw HTML requests total (incl. bots, prefetch, link previews)`);
    }
    const v2 = report.sources.analyticsEngine.pageviewsSchemaV2;
    if (v2 != null && rawAllHtml != null) {
        lines.push(`    ↳ ${fmtNum(v2)} rows classifiable (schema v2); ${fmtNum(rawAllHtml - v2)} predate the bot-score fix`);
    }
    const d1 = report.sources.d1Client;
    lines.push(`• Pillar 2 (D1 union):         ${fmtNum(d1.pageviews)} pageviews  (${fmtPct(report.ratios.pillar2_vs_cf)} of CF)`);
    if (d1.pageviewsClientBeacon != null || d1.pageviewsEdgeFallback != null) {
        lines.push(`    ↳ ${fmtNum(d1.pageviewsClientBeacon ?? null)} client beacons, ${fmtNum(d1.pageviewsEdgeFallback ?? null)} edge fallback writes`);
        if (d1.pageviewsDedupedUnion != null) {
            lines.push(`    ↳ ${fmtNum(d1.pageviewsDedupedUnion)} after dedupe by hour+path+country (lower bound; collapses repeat visits)`);
        }
        if (report.ratios.clientBlockerSuppression != null) {
            lines.push(`    ↳ ${fmtPct(report.ratios.clientBlockerSuppression)} of captured pageviews came via the edge fallback (floor on blocker suppression)`);
        }
    }
    lines.push(`• Verdict: ${report.verdict.toUpperCase()}`);
    for (const n of report.notes) lines.push(`  ⚠ ${n}`);
    if (report.sources.cfWebAnalytics.error) lines.push(`  ✗ CF Web Analytics error: ${report.sources.cfWebAnalytics.error}`);
    if (report.sources.analyticsEngine.error) lines.push(`  ✗ Analytics Engine error: ${report.sources.analyticsEngine.error}`);
    if (report.sources.d1Client.error) lines.push(`  ✗ D1 client error: ${report.sources.d1Client.error}`);
    return lines.join('\n');
}
