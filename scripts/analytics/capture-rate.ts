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

const ACCOUNT_ID = 'ea158eac6035716195ee97831b85562c';
const AE_DATASET = 'jsonexport_pageviews';
const WEB_ANALYTICS_SITE_TAG = 'cf7c385cfd434867b78284cb63af585a';

export interface CaptureRateReport {
    window: { startIso: string; endIso: string; hours: number };
    sources: {
        cfWebAnalytics: { pageviews: number | null; error?: string };
        // Analytics Engine returns both the raw count (all HTML HTTP GETs
        // the edge worker saw, including bots + prefetches + link previews)
        // and a "human-looking" subset (bot and automated UA classes filtered
        // out). Only the human-looking number is comparable to CF RUM.
        analyticsEngine: {
            pageviews: number | null;
            pageviewsRawAllHtml?: number | null;
            error?: string;
        };
        d1Client: { pageviews: number | null; error?: string };
    };
    ratios: {
        pillar1_vs_cf: number | null;  // human-filtered AE / CF RUM — should be ~1.0
        pillar2_vs_cf: number | null;  // the capture rate we care about
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
    /** blob4 (uaClass) NOT IN ('bot','automated') — approximates real users. */
    humanLike: number;
}

async function fetchAnalyticsEnginePageviews(
    env: Env,
    startIso: string,
    endIso: string
): Promise<AePageviewCounts> {
    // edge-worker.ts writes uaClass to blob4 ('bot' | 'automated' | 'mobile'
    // | 'desktop' | 'other' | 'unknown'). Filter the bot classes out to get a
    // human-looking count comparable to CF RUM. We query both numbers in one
    // SQL round-trip so the raw-vs-filtered gap is visible in the report —
    // if bot traffic suddenly spikes we want to see it, not have it masked.
    const tsFrom = startIso.replace('T', ' ').replace(/\.\d+Z$/, '');
    const tsTo = endIso.replace('T', ' ').replace(/\.\d+Z$/, '');
    const sql = `
      SELECT
        SUM(_sample_interval) AS raw,
        SUMIf(_sample_interval, blob4 NOT IN ('bot', 'automated')) AS human_like
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
    const humanLike = Number(row.human_like || 0);
    if (!Number.isFinite(raw) || !Number.isFinite(humanLike)) {
        throw new Error('Analytics Engine returned non-numeric');
    }
    return { raw, humanLike };
}

async function fetchD1Pageviews(startMs: number, endMs: number): Promise<number> {
    const fs = require('fs');
    const path = require('path');
    const file = path.resolve(process.cwd(), 'performance_data/telemetry_latest.json');
    if (!fs.existsSync(file)) throw new Error('telemetry_latest.json missing (run `npm run telemetry:pull` first)');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const events = data.events || [];
    return events.filter((e: any) =>
        e.event_name === 'page_view' && e.timestamp >= startMs && e.timestamp < endMs
    ).length;
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
            ratios: { pillar1_vs_cf: null, pillar2_vs_cf: null },
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
        ? { pageviews: aeRes.value.humanLike, pageviewsRawAllHtml: aeRes.value.raw }
        : { pageviews: null, pageviewsRawAllHtml: null, error: String(aeRes.reason).slice(0, 200) };
    const d1 = d1Res.status === 'fulfilled'
        ? { pageviews: d1Res.value }
        : { pageviews: null, error: String(d1Res.reason).slice(0, 200) };

    const ratio = (num: number | null, denom: number | null) =>
        (num == null || denom == null || denom === 0) ? null : num / denom;

    // Pillar 1 ratio uses the human-filtered AE count. The raw count
    // (bots + prefetch + previews included) is shown separately in the
    // report so bot-traffic spikes stay visible.
    const pillar1 = ratio(ae.pageviews, cf.pageviews);
    const pillar2 = ratio(d1.pageviews, cf.pageviews);

    let verdict: CaptureRateReport['verdict'] = 'unknown';
    if (cf.pageviews != null && d1.pageviews != null) {
        if (pillar2 != null && pillar2 >= 0.70) verdict = 'healthy';
        else verdict = 'degraded';
    }

    // Alert thresholds tightened to avoid noise in low-traffic windows:
    //   - Pillar 1 must be <0.5x or >2x CF RUM AND volume > 50 to warn
    //   - Bot share > 60% is its own warning
    if (
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
            `Pillar 2 (D1 client) capture is ${(pillar2 * 100).toFixed(1)}% — below the 70% SLO. Content blockers (uBlock, Brave Shields, iOS ITP) are suppressing client beacons. Options: (a) accept, this is the trade-off of client-side telemetry; (b) have the edge worker write pageviews directly to D1 to catch blocked users, deduped by cf-ray.`
        );
    }
    if (cf.pageviews === 0) {
        notes.push('CF Web Analytics returned 0 pageviews for this window — may indicate a reporting lag; retry later.');
    }

    return {
        window: { startIso, endIso, hours: windowHours },
        sources: { cfWebAnalytics: cf, analyticsEngine: ae, d1Client: d1 },
        ratios: { pillar1_vs_cf: pillar1, pillar2_vs_cf: pillar2 },
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
    lines.push('│ 4. CAPTURE-RATE RECONCILIATION — telemetry health check            │');
    lines.push('└───────────────────────────────────────────────────────────────────┘');
    lines.push(`• Window:  ${report.window.hours}h  (${report.window.startIso} → ${report.window.endIso})`);
    lines.push(`• CF Web Analytics (RUM):      ${fmtNum(report.sources.cfWebAnalytics.pageviews)} pageviews (JS-only, real users)`);
    const rawAllHtml = report.sources.analyticsEngine.pageviewsRawAllHtml;
    lines.push(`• Pillar 1 (Analytics Engine): ${fmtNum(report.sources.analyticsEngine.pageviews)} human-looking pageviews  (${fmtPct(report.ratios.pillar1_vs_cf)} of CF)`);
    if (rawAllHtml != null) {
        lines.push(`    ↳ ${fmtNum(rawAllHtml)} raw HTML requests total (incl. bots, prefetch, link previews)`);
    }
    lines.push(`• Pillar 2 (D1 client):        ${fmtNum(report.sources.d1Client.pageviews)} pageviews  (${fmtPct(report.ratios.pillar2_vs_cf)} of CF)`);
    lines.push(`• Verdict: ${report.verdict.toUpperCase()}`);
    for (const n of report.notes) lines.push(`  ⚠ ${n}`);
    if (report.sources.cfWebAnalytics.error) lines.push(`  ✗ CF Web Analytics error: ${report.sources.cfWebAnalytics.error}`);
    if (report.sources.analyticsEngine.error) lines.push(`  ✗ Analytics Engine error: ${report.sources.analyticsEngine.error}`);
    if (report.sources.d1Client.error) lines.push(`  ✗ D1 client error: ${report.sources.d1Client.error}`);
    return lines.join('\n');
}
