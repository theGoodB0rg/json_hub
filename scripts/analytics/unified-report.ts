import fs from 'fs';
import path from 'path';
import { pullTelemetryData } from '../pull-telemetry';
import { loadGscData, GscSummary, GscQuery, GscPage } from './gsc-parser';
import { fetchLiveGscData, GscTrend } from './gsc-fetcher';
import { computeCaptureRate, formatCaptureRateSection } from './capture-rate';
import { computeMonetization, MonetizationFunnel } from '../../lib/analytics/monetization';

interface TelemetryEvent {
    id: string;
    event_name: string;
    platform?: string;
    format?: string;
    file_size_bytes?: number;
    duration_ms?: number;
    error_type?: string;
    error_message?: string;
    country?: string;
    path?: string;
    timestamp: number;
}

interface TelemetryFeedback {
    id: string;
    rating: 'positive' | 'negative' | 'neutral';
    comment?: string;
    platform?: string;
    format?: string;
    path?: string;
    timestamp: number;
    /** 1 when the rating came from a demo/sample conversion or an automated
     *  test rather than a genuine user upload. Added 2026-10-10; rows written
     *  before that carry `undefined` and are reported as unclassified rather
     *  than silently counted as genuine. */
    is_sample?: number | boolean;
}

/** Epoch at which `is_sample` started being written to `user_feedback`.
 *  Ratings older than this cannot be classified as genuine or test. */
const FEEDBACK_FLAG_EPOCH = Date.parse('2026-10-11T00:00:00Z');

/** Events that mean someone used the converter, not just loaded a page. */
const ACTIVITY_EVENTS = new Set(['parse_success', 'parse_error', 'export_success', 'export_complete', 'export_error']);

function formatMonetizationSection(m: MonetizationFunnel): string {
    const sources = Object.entries(m.checkoutClicks).sort((a, b) => b[1] - a[1]);
    const failureRows = Object.entries(m.activationFailureReasons).sort((a, b) => b[1] - a[1]);
    // Attempts logged before license_activated / license_activation_failed
    // existed carry no outcome. Showing them as neither is honest; folding
    // them into "rejected" would invent an incident.
    const unaccounted = Math.max(0, m.activationAttempts - m.activationSucceeded - m.activationFailed);
    return `
---

## 5. Monetization Funnel — Purchase Intent

| Step | Count |
| :--- | :--- |
| Pro landing page views (/desktop) | ${m.desktopPageViews} |
| Post-export upsell shown | ${m.upsellShown} |
| Post-export upsell dismissed | ${m.upsellDismissed} |
| **Buy-button clicks (all sources)** | **${m.totalCheckoutClicks}** |
| Post-export upsell clicks (before buy tracking) | ${m.legacyUpsellClicks} |
| Desktop app downloads | ${m.desktopDownloads} |
| License activation attempts | ${m.activationAttempts} |
| ↳ activated successfully | ${m.activationSucceeded} |
| ↳ rejected | ${m.activationFailed} |
${unaccounted > 0 ? `| ↳ outcome not recorded (pre-instrumentation) | ${unaccounted} |
` : ''}
${failureRows.length > 0 ? `### Activation failures by reason
| Reason | Count |
| :--- | :--- |
${failureRows.map(([r, n]) => `| \`${r}\` | ${n} |`).join('\n')}

> \`server_error\`, \`not_found\` or \`network\` here means a buyer was blocked by us, not by a bad key. Check Gumroad for a sale at the same time.
` : ''}
${sources.length > 0 ? `### Buy-button clicks by source
| Source | Clicks |
| :--- | :--- |
${sources.map(([s, n]) => `| \`${s}\` | ${n} |`).join('\n')}
` : '_No buy-button clicks recorded yet._'}
> Sales are recorded in Gumroad, not here. Clicks with no sales point at the offer or price; no clicks point at traffic.
`;
}

function printMonetizationBlock(m: MonetizationFunnel): void {
    console.log('\n┌───────────────────────────────────────────────────────────────────┐');
    console.log('│ 4. MONETIZATION FUNNEL — PURCHASE INTENT                           │');
    console.log('└───────────────────────────────────────────────────────────────────┘');
    console.log(`• Pro Landing Views (/desktop): ${m.desktopPageViews}`);
    console.log(`• Post-export Upsell Shown:     ${m.upsellShown} (dismissed ${m.upsellDismissed})`);
    console.log(`• Buy-button Clicks:            ${m.totalCheckoutClicks}`);
    for (const [source, n] of Object.entries(m.checkoutClicks).sort((a, b) => b[1] - a[1])) {
        console.log(`    ↳ ${source.padEnd(26)} ${n}`);
    }
    console.log(`• Upsell Clicks (pre-tracking): ${m.legacyUpsellClicks}`);
    console.log(`• Desktop Downloads:            ${m.desktopDownloads}`);
    console.log(`• License Activation Attempts:  ${m.activationAttempts}`);
    if (m.activationAttempts > 0) {
        const unaccounted = Math.max(0, m.activationAttempts - m.activationSucceeded - m.activationFailed);
        console.log(`    ↳ activated                 ${m.activationSucceeded}`);
        console.log(`    ↳ rejected                  ${m.activationFailed}`);
        if (unaccounted > 0) {
            console.log(`    ↳ outcome not recorded      ${unaccounted}  (logged before outcome tracking)`);
        }
        for (const [reason, n] of Object.entries(m.activationFailureReasons).sort((a, b) => b[1] - a[1])) {
            console.log(`        · ${reason.padEnd(22)} ${n}`);
        }
        if (m.activationFailureReasons.server_error || m.activationFailureReasons.not_found || m.activationFailureReasons.network) {
            console.log('    ⚠ A rejection we caused, not a bad key. Cross-check Gumroad for a sale at that time.');
        }
    }
    console.log('  ↳ Sales live in Gumroad. Clicks without sales = offer/price problem; no clicks = traffic problem.');
}

interface UnifiedReportData {
    generatedAt: string;
    gsc: GscSummary;
    /** Month-over-month organic trend. Undefined when GSC is unreachable and
     *  the report falls back to local CSV snapshots. */
    gscTrend?: GscTrend;
    telemetry: {
        totalEvents: number;
        pageViews: number;
        parseAttempts: number;
        parseSuccess: number;
        userParses: number;
        sampleParses: number;
        exportComplete: number;
        parseErrors: number;
        exportErrors: number;
        conversionRate: number;
        positiveFeedback: number;
        negativeFeedback: number;
        /** Satisfaction across GENUINE feedback only. null when no genuine
         *  rating has been recorded yet — reporting 100% or 0% off an empty
         *  set is worse than reporting nothing. */
        satisfactionRate: number | null;
        /** Ratings excluded as demo/sample/automated-test submissions. */
        sampleFeedback: number;
        /** Ratings written before `is_sample` existed on the feedback table,
         *  so they cannot be classified either way. */
        unclassifiedFeedback: number;
        platformCounts: Record<string, { parses: number; exports: number }>;
        topCountries: Array<{ country: string; count: number }>;
        /** Keyed `event_name:error_type`. */
        topErrors: Array<{ error: string; count: number; samplePath?: string; example?: string }>;
        /** parse_error / (parse_success + parse_error), genuine events only. */
        parseErrorRate: number;
        recentFeedback: Array<TelemetryFeedback & { unclassified?: boolean }>;
    };
    monetization: MonetizationFunnel;
    recommendations: string[];
}

export async function generateUnifiedAnalyticsReport(): Promise<UnifiedReportData> {
    const outDir = path.resolve(process.cwd(), 'performance_data');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log('\n======================================================');
    console.log('🔄 INITIATING UNIFIED ANALYTICS & INTELLIGENCE PIPELINE');
    console.log('======================================================\n');

    // 1. Pull latest Cloudflare D1 telemetry
    console.log('📡 [1/3] Syncing Live Cloudflare D1 Conversion Telemetry...');
    let telemetryRaw: { events: TelemetryEvent[]; feedback: TelemetryFeedback[] } = { events: [], feedback: [] };
    try {
        const pullResult = await pullTelemetryData();
        telemetryRaw = pullResult || { events: [], feedback: [] };
    } catch (e: any) {
        console.warn(`⚠️ Telemetry sync warning: ${e.message}`);
    }

    // 2. Fetch Live Google Search Console Organic Intelligence
    console.log('🔍 [2/3] Querying Google Search Console Live API...');
    let gscSummary: GscSummary;
    let gscTrend: GscTrend | undefined;
    try {
        const liveGsc = await fetchLiveGscData();
        const topQueries: GscQuery[] = liveGsc.queries
            .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
            .slice(0, 20)
            .map((q) => ({
                query: q.query,
                clicks: q.clicks,
                impressions: q.impressions,
                ctr: Number((q.ctr * 100).toFixed(2)),
                position: Number(q.position.toFixed(1)),
                opportunityScore: q.impressions * (1 - q.ctr),
            }));

        const opportunityQueries: GscQuery[] = liveGsc.queries
            .filter((q) => q.position >= 3 && q.position <= 25 && q.impressions >= 10)
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 15)
            .map((q) => ({
                query: q.query,
                clicks: q.clicks,
                impressions: q.impressions,
                ctr: Number((q.ctr * 100).toFixed(2)),
                position: Number(q.position.toFixed(1)),
                opportunityScore: q.impressions * (1 - q.ctr),
            }));

        const topPages: GscPage[] = liveGsc.pages
            .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
            .slice(0, 20)
            .map((p) => ({
                page: p.page,
                clicks: p.clicks,
                impressions: p.impressions,
                ctr: Number((p.ctr * 100).toFixed(2)),
                position: Number(p.position.toFixed(1)),
            }));

        gscSummary = {
            totalClicks: liveGsc.totalClicks,
            totalImpressions: liveGsc.totalImpressions,
            avgCtr: Number(liveGsc.avgCtr.toFixed(2)),
            avgPosition: Number(liveGsc.avgPosition.toFixed(1)),
            topQueries,
            opportunityQueries,
            topPages,
            countries: [],
            devices: [],
            source: `Live Google Search Console API (${liveGsc.startDate} to ${liveGsc.endDate})`,
            queryCoverage: liveGsc.queryCoverage,
        };
        gscTrend = liveGsc.trend;

        // Save live snapshot
        fs.writeFileSync(path.join(outDir, 'gsc_live_latest.json'), JSON.stringify(liveGsc, null, 2), 'utf8');
        console.log(`✅ Live GSC API Connected: ${liveGsc.queries.length} queries, ${liveGsc.pages.length} pages pulled.`);
    } catch (e: any) {
        console.warn(`⚠️ Live GSC fetch notice: ${e.message}`);
        console.log('🔄 Reading local Search Console snapshots...');
        gscSummary = loadGscData();
    }

    // 3. Process Telemetry Metrics
    console.log('📊 [3/3] Cross-referencing Conversion & Organic Intelligence...\n');
    const events: TelemetryEvent[] = telemetryRaw.events || [];
    const feedback: TelemetryFeedback[] = telemetryRaw.feedback || [];

    const pageViews = events.filter(e => e.event_name === 'page_view').length;
    const parseAttempts = events.filter(e => e.event_name === 'parse_start' || e.event_name === 'parse_success' || e.event_name === 'parse_error').length;
    const isSampleEvent = (e: any) => e.is_sample === 1 || e.is_sample === true || e.is_sample === 'true' || e.event_name === 'sample_preview';
    const sampleParses = events.filter(e => (e.event_name === 'sample_preview' || e.event_name === 'parse_success') && isSampleEvent(e)).length;
    const userParses = events.filter(e => e.event_name === 'parse_success' && !isSampleEvent(e)).length;
    const parseSuccess = userParses;
    const parseErrors = events.filter(e => e.event_name === 'parse_error' && !isSampleEvent(e)).length;
    const isExport = (e: TelemetryEvent) => e.event_name === 'export_complete' || e.event_name === 'export_success';
    const exportComplete = events.filter(e => isExport(e) && !isSampleEvent(e)).length;
    const exportErrors = events.filter(e => e.event_name === 'export_error').length;

    const platformCounts: Record<string, { parses: number; exports: number }> = {};
    const countryMap: Record<string, number> = {};

    for (const e of events) {
        const p = (e.platform || 'general').toLowerCase();
        if (!platformCounts[p]) platformCounts[p] = { parses: 0, exports: 0 };
        if (e.event_name === 'parse_success' && !isSampleEvent(e)) platformCounts[p].parses++;
        if (isExport(e) && !isSampleEvent(e)) platformCounts[p].exports++;

        // Countries of people who actually used the tool. Page views are left
        // out: the edge fallback counts data-centre scrapers (PL/NL/SG rows
        // with no activity), which made bot traffic look like the top markets.
        if (ACTIVITY_EVENTS.has(e.event_name) && !isSampleEvent(e) && e.country && e.country !== 'Unknown') {
            countryMap[e.country] = (countryMap[e.country] || 0) + 1;
        }
    }

    const topCountries = Object.entries(countryMap)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Feedback hygiene.
    //
    // Before this filter existed the dashboard reported "9.1% satisfaction"
    // off 11 rows, 9 of which were our own test submissions (8 identical
    // "Missing changelog" Jira probes plus one row literally captioned
    // "Live deployment test from assistant"). A metric that reports our own
    // QA as user dissatisfaction is worse than no metric, because it triggers
    // the "inspect flattening bugs" recommendation on every run.
    //
    // Rows written before FEEDBACK_FLAG_EPOCH predate the is_sample column on
    // user_feedback, so they are genuinely unclassifiable. They are reported
    // separately rather than assumed genuine — same convention Pillar 1 uses
    // for Analytics Engine rows that predate the bot-score fix.
    //
    // Second poisoning vector (Oct 2026): automation that never sets the
    // client flag. jsdom QA probes arrived with is_sample = 0 and read as
    // genuine dissatisfaction. Two layers now prevent recurrence — the client
    // auto-flags automation (lib/telemetry/sample-detection.ts) and the
    // worker forces is_sample = 1 on automation UAs server-side
    // (worker/telemetry-worker.ts resolveServerSampleFlag). Either layer
    // alone quarantines the row; both are tested.
    const isSampleFeedback = (f: TelemetryFeedback) =>
        f.is_sample === 1 || f.is_sample === true;
    const classifiedFeedback = feedback.filter(f => f.timestamp >= FEEDBACK_FLAG_EPOCH);
    const unclassifiedFeedback = feedback.length - classifiedFeedback.length;
    const genuineFeedback = classifiedFeedback.filter(f => !isSampleFeedback(f));
    const sampleFeedback = classifiedFeedback.length - genuineFeedback.length;
    const knownTestComments = new Set(
        classifiedFeedback.filter(isSampleFeedback).map(f => f.comment).filter(Boolean)
    );
    const unclassifiedForDisplay = feedback
        .filter(f => f.timestamp < FEEDBACK_FLAG_EPOCH && !(f.comment && knownTestComments.has(f.comment)))
        .map(f => ({ ...f, unclassified: true }));

    const posFeedback = genuineFeedback.filter(f => f.rating === 'positive').length;
    const negFeedback = genuineFeedback.filter(f => f.rating === 'negative').length;
    const totalRated = posFeedback + negFeedback;
    const satisfactionRate = totalRated > 0 ? Number(((posFeedback / totalRated) * 100).toFixed(1)) : null;
    const conversionRate = userParses > 0 ? Number(((exportComplete / userParses) * 100).toFixed(1)) : 0;

    // Only real error events. page_view_edge rows carry an `edge:bot_score=…`
    // breadcrumb in error_type and used to dominate this list.
    // worker_init_failed is listed here but is not a parse_error, so it stays out of the parse failure rate.
    const errorEvents = events.filter(e => (e.event_name.endsWith('_error') || e.event_name === 'worker_init_failed') && !isSampleEvent(e));
    const errorMap: Record<string, { count: number; samplePath?: string; example?: string }> = {};
    for (const e of errorEvents) {
        // Rows from before 2026-10-15 reached D1 with no message or type.
        const key = `${e.event_name}:${e.error_type || 'unrecorded'}`;
        if (!errorMap[key]) errorMap[key] = { count: 0, samplePath: e.path, example: e.error_message };
        errorMap[key].count++;
    }
    const topErrors = Object.entries(errorMap)
        .map(([error, data]) => ({ error, count: data.count, samplePath: data.samplePath, example: data.example }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    const parseErrorRate = userParses + parseErrors > 0
        ? Number(((parseErrors / (userParses + parseErrors)) * 100).toFixed(1))
        : 0;

    // 4. Strategic Recommendations Generator
    const recommendations: string[] = [];

    // GSC opportunities
    if (gscSummary.opportunityQueries.length > 0) {
        const topOpp = gscSummary.opportunityQueries[0];
        recommendations.push(
            `High Organic Growth Potential: Query "${topOpp.query}" has ${topOpp.impressions} impressions at position ${topOpp.position.toFixed(1)} with ${topOpp.ctr}% CTR. Optimize title tags and schema on corresponding pages to capture #1 position clicks.`
        );
    }

    // Top traffic page
    if (gscSummary.topPages.length > 0) {
        const topPage = gscSummary.topPages[0];
        recommendations.push(
            `Top Traffic Asset: "${topPage.page}" drives the majority of organic clicks (${topPage.clicks} clicks, ${topPage.impressions} impressions). Ensure sample tables and 1-click export CTAs remain prominent.`
        );
    }

    // Momentum. Stated against the matched day span so a partial current
    // month never reads as a collapse.
    const momentum = gscTrend?.momentum;
    if (momentum && momentum.changePct !== null) {
        const changePct = momentum.changePct;
        const dir = changePct > 5 ? 'ahead of' : changePct < -5 ? 'behind' : 'level with';
        recommendations.push(
            `Organic Momentum: ${momentum.currentMonth} is ${dir} ${momentum.previousMonth} over the matched first ${momentum.daySpan} days (${momentum.currentClicks} vs ${momentum.previousClicks} clicks, ${changePct >= 0 ? '+' : ''}${changePct.toFixed(0)}%). Compare equal day spans only — the current month is still partial.`
        );
    }

    // Satisfaction. Only speaks when there is genuine feedback to speak about.
    if (satisfactionRate === null) {
        if (sampleFeedback > 0 || unclassifiedFeedback > 0) {
            recommendations.push(
                `Feedback Signal: no genuine user ratings yet (${sampleFeedback} test submission(s) excluded, ${unclassifiedFeedback} unclassifiable pre-${new Date(FEEDBACK_FLAG_EPOCH).toISOString().slice(0, 10)}). Satisfaction is unmeasured, not bad — do not act on it.`
            );
        }
    } else if (totalRated < 5) {
        recommendations.push(
            `Feedback Signal: ${satisfactionRate}% satisfaction across only ${totalRated} genuine rating(s). Too small to act on — collect more before drawing conclusions.`
        );
    } else if (satisfactionRate >= 90) {
        recommendations.push(
            `Output Quality: ${satisfactionRate}% satisfaction across ${totalRated} genuine user ratings. Conversion flattening engine is operating cleanly.`
        );
    } else if (satisfactionRate < 80) {
        recommendations.push(
            `Alert: User satisfaction is at ${satisfactionRate}% across ${totalRated} genuine ratings. Inspect negative feedback in performance_data/telemetry_latest.json to isolate flattening bugs.`
        );
    }

    const reportData: UnifiedReportData = {
        generatedAt: new Date().toUTCString(),
        gsc: gscSummary,
        gscTrend,
        telemetry: {
            totalEvents: events.length,
            pageViews,
            parseAttempts,
            parseSuccess,
            userParses,
            sampleParses,
            exportComplete,
            parseErrors,
            exportErrors,
            conversionRate,
            positiveFeedback: posFeedback,
            negativeFeedback: negFeedback,
            satisfactionRate,
            sampleFeedback,
            unclassifiedFeedback,
            platformCounts,
            topCountries,
            topErrors,
            parseErrorRate,
            // Surface genuine ratings first so real complaints are never
            // pushed off the list by a burst of test submissions.
            //
            // Unclassified rows (pre-flag) come next, minus any whose comment
            // matches a known test submission. Without them the only genuine
            // complaint on record — Trello, 2026-09-22, "rows were duplicated
            // and plugin data was missing" — never appeared in the report.
            recentFeedback: [
                ...genuineFeedback,
                ...unclassifiedForDisplay,
                ...classifiedFeedback.filter(isSampleFeedback),
            ].slice(0, 6),
        },
        monetization: computeMonetization(events),
        recommendations,
    };

    // 5. Generate Formatted Output Artifacts
    const mdReport = formatMarkdownReport(reportData);
    fs.writeFileSync(path.join(outDir, 'unified_analytics_latest.md'), mdReport, 'utf8');
    fs.writeFileSync(path.join(outDir, 'unified_analytics_latest.json'), JSON.stringify(reportData, null, 2), 'utf8');

    // 6. Terminal Output Dashboard
    await printTerminalDashboard(reportData);

    return reportData;
}

const UNRECORDED_NOTE = '"unrecorded" rows predate 2026-10-15, when error type and message started reaching D1.';

function formatErrorSection(t: UnifiedReportData['telemetry']): string {
    if (t.topErrors.length === 0) return '';
    const rows = t.topErrors.map(e =>
        `| \`${e.error}\` | ${e.count} | ${e.example ? e.example.replace(/\|/g, '\\|') : '—'} | ${e.samplePath || '—'} |`
    );
    return `### Errors (parse failure rate ${t.parseErrorRate}%)
| Event : type | Count | Example (redacted) | Seen on |
| :--- | :--- | :--- | :--- |
${rows.join('\n')}

> ${UNRECORDED_NOTE}
`;
}

function printErrorBlock(t: UnifiedReportData['telemetry']): void {
    if (t.topErrors.length === 0) return;
    console.log(`\nErrors (parse failure rate ${t.parseErrorRate}%):`);
    for (const e of t.topErrors) {
        console.log(`  ⚠ ${e.error.padEnd(34)} ${String(e.count).padStart(4)}  ${e.samplePath || ''}${e.example ? `  — ${e.example}` : ''}`);
    }
    if (t.topErrors.some(e => e.error.endsWith(':unrecorded'))) {
        console.log(`  ↳ ${UNRECORDED_NOTE}`);
    }
}

/** Human-readable satisfaction cell that never invents a number. */
function formatSatisfaction(t: UnifiedReportData['telemetry']): string {
    const excluded: string[] = [];
    if (t.sampleFeedback > 0) excluded.push(`${t.sampleFeedback} test`);
    if (t.unclassifiedFeedback > 0) excluded.push(`${t.unclassifiedFeedback} unclassified`);
    const suffix = excluded.length > 0 ? ` — ${excluded.join(', ')} excluded` : '';

    if (t.satisfactionRate === null) {
        return `no genuine ratings yet${suffix}`;
    }
    return `${t.satisfactionRate}% (👍 ${t.positiveFeedback} | 👎 ${t.negativeFeedback})${suffix}`;
}

function formatTrendSection(trend?: GscTrend): string {
    if (!trend || trend.months.length === 0) return '';

    const rows = trend.months
        .map(m => `| ${m.month}${m.days < 28 ? ` *(${m.days}d, partial)*` : ''} | ${m.clicks} | ${m.impressions.toLocaleString()} | ${m.ctr.toFixed(2)}% | ${m.clicksPerDay.toFixed(2)} | ${m.avgPosition.toFixed(1)} |`)
        .join('\n');

    const m = trend.momentum;
    const momentumLine = m && m.changePct !== null
        ? `\n> [!NOTE]\n> **Like-for-like momentum:** ${m.currentMonth} has ${m.currentClicks} clicks over its first ${m.daySpan} days vs ${m.previousClicks} for ${m.previousMonth} over the same span — **${m.changePct >= 0 ? '+' : ''}${m.changePct.toFixed(0)}%**. The current month is partial; comparing it against a full previous month would read as a false collapse.\n`
        : '';

    return `
---

## 2. Organic Trend — Month over Month

| Month | Clicks | Impressions | CTR | Clicks/day | Avg Position |
| :--- | :--- | :--- | :--- | :--- | :--- |
${rows}
${momentumLine}`;
}

/** Terminal rendering of the month-over-month trend, with an inline bar so
 *  the shape of the curve is readable without reaching for the markdown. */
function printTrendBlock(trend?: GscTrend): void {
    if (!trend || trend.months.length === 0) return;

    console.log('\n┌───────────────────────────────────────────────────────────────────┐');
    console.log('│ 2. ORGANIC TREND — MONTH OVER MONTH                                │');
    console.log('└───────────────────────────────────────────────────────────────────┘');
    console.log('Month     Days  Clicks   Impr    CTR     Clk/day  Pos');

    const peak = Math.max(...trend.months.map(m => m.clicks), 1);
    for (const m of trend.months) {
        const bar = '█'.repeat(Math.max(1, Math.round((m.clicks / peak) * 22)));
        const partial = m.days < 28 ? '*' : ' ';
        console.log(
            `${m.month}${partial} ${String(m.days).padStart(5)} ${String(m.clicks).padStart(7)} ` +
            `${String(m.impressions).padStart(6)} ${(m.ctr.toFixed(2) + '%').padStart(7)} ` +
            `${m.clicksPerDay.toFixed(2).padStart(8)} ${m.avgPosition.toFixed(1).padStart(5)}  ${bar}`
        );
    }
    if (trend.months.some(m => m.days < 28)) {
        console.log('  * partial month — not comparable to a full month total');
    }

    const m = trend.momentum;
    if (m && m.changePct !== null) {
        const arrow = m.changePct > 5 ? '📈' : m.changePct < -5 ? '📉' : '➡️';
        console.log(
            `\n${arrow} Like-for-like: ${m.currentMonth} ${m.currentClicks} clicks vs ${m.previousMonth} ${m.previousClicks} ` +
            `over the matched first ${m.daySpan} days (${m.changePct >= 0 ? '+' : ''}${m.changePct.toFixed(0)}%)`
        );
        console.log('  ↳ Equal day spans only. The running month is partial, so its total is not a decline.');
    }
}

function formatFeedbackLine(f: { rating: string; platform?: string; comment?: string; timestamp: number; unclassified?: boolean }, quarantined: boolean): string {
    const icon = f.rating === 'positive' ? '👍' : '👎';
    const tag = quarantined ? '🧪 test ' : f.unclassified ? '❔ unclassified ' : '';
    return `- **${tag}${icon} [${f.platform || 'general'}]**: "${f.comment || 'No comment'}" _(${new Date(f.timestamp).toLocaleDateString()})_`;
}

function formatMarkdownReport(data: UnifiedReportData): string {
    const { gsc, telemetry, recommendations, generatedAt, gscTrend } = data;
    const isSampleRow = (f: { is_sample?: number | boolean }) => f.is_sample === 1 || (f.is_sample as unknown) === true;
    const genuineLines = telemetry.recentFeedback.filter(f => !isSampleRow(f)).map(f => formatFeedbackLine(f, false));
    const quarantinedLines = telemetry.recentFeedback.filter(isSampleRow).map(f => formatFeedbackLine(f, true));
    const quarantineNote = telemetry.sampleFeedback > 0 || quarantinedLines.length > 0
        ? `\n\n#### 🧪 Quarantined test submissions (shown, not counted — excluded from satisfaction)\n${quarantinedLines.length > 0 ? quarantinedLines.join('\n') : `_(${telemetry.sampleFeedback} test submission(s) outside the recent window)_`}`
        : '';

    return `# Unified Analytics & Search Intelligence Report

*Generated at: ${generatedAt}*

---

## 1. Executive Summary

| Metric | Value |
| :--- | :--- |
| **Total Organic Search Clicks** | **${gsc.totalClicks.toLocaleString()}** |
| **Total Search Impressions** | **${gsc.totalImpressions.toLocaleString()}** |
| **Average Organic CTR** | **${gsc.avgCtr}%** |
| **Average Position** (impression-weighted) | **${gsc.avgPosition}** |${gsc.queryCoverage ? `
| Query-level coverage | ${(gsc.queryCoverage.clickShare * 100).toFixed(0)}% of clicks, ${(gsc.queryCoverage.impressionShare * 100).toFixed(0)}% of impressions (Google withholds rare queries) |` : ''}
| **Tracked Page Views** | **${telemetry.pageViews}** |
| **Successful Data Parses** | **${telemetry.parseSuccess}** |
| **Spreadsheets Exported** | **${telemetry.exportComplete}** |
| **User Output Satisfaction** | ${formatSatisfaction(telemetry)} |
${formatTrendSection(gscTrend)}
---

## 3. Google Search Console Organic Demand

### Top Driving Queries
| Query | Clicks | Impressions | CTR | Avg Position |
| :--- | :--- | :--- | :--- | :--- |
${gsc.topQueries.slice(0, 10).map(q => `| \`${q.query}\` | ${q.clicks} | ${q.impressions} | ${q.ctr}% | ${q.position} |`).join('\n')}

### High-Opportunity Keywords (Positions 3–25 with High Search Volume)
> [!TIP]
> These queries have significant search volume but sub-optimal click-through rates. Creating dedicated programmatic landing pages or updating title tags will rapidly drive organic traffic.

| Keyword | Impressions | Current Pos | CTR | Potential Growth Action |
| :--- | :--- | :--- | :--- | :--- |
${gsc.opportunityQueries.slice(0, 8).map(q => `| \`${q.query}\` | ${q.impressions} | ${q.position} | ${q.ctr}% | Target with custom landing page & sample data |`).join('\n')}

### Top Organic Landing Pages
| Page | Clicks | Impressions | CTR | Position |
| :--- | :--- | :--- | :--- | :--- |
${gsc.topPages.slice(0, 10).map(p => `| [${p.page}](${p.page.startsWith('http') ? p.page : `https://jsonexport.com${p.page}`}) | ${p.clicks} | ${p.impressions} | ${p.ctr}% | ${p.position} |`).join('\n')}

---

## 4. In-App Conversion & Satisfaction Telemetry

- **Page Views**: ${telemetry.pageViews}
- **User Uploads Parsed**: ${telemetry.userParses}
- **Demo Previews Loaded**: ${telemetry.sampleParses}
- **Exports Completed**: ${telemetry.exportComplete}
- **User Conversion Rate**: ${telemetry.conversionRate}%
- **Output Satisfaction**: ${formatSatisfaction(telemetry)}

${formatErrorSection(telemetry)}
${telemetry.topCountries.length > 0 ? `### Countries of Active Users
_People who loaded data or exported. Page views are excluded because they include data-centre scrapers._

| Country | Events |
| :--- | :--- |
${telemetry.topCountries.map(c => `| ${c.country} | ${c.count} |`).join('\n')}
` : ''}

${genuineLines.length > 0 || quarantinedLines.length > 0 || telemetry.sampleFeedback > 0 ? `### User Output Feedback
${genuineLines.length > 0 ? genuineLines.join('\n') : '_No genuine user ratings in the recent window._'}${quarantineNote}` : ''}
${formatMonetizationSection(data.monetization)}
---

## 6. Key Recommendations & Action Items

${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}
`;
}

async function printTerminalDashboard(data: UnifiedReportData): Promise<void> {
    const { gsc, telemetry, recommendations } = data;

    console.log('======================================================================');
    console.log('🚀 JSONEXPORT.COM — UNIFIED SEARCH & CONVERSION INTELLIGENCE DASHBOARD');
    console.log('======================================================================');
    console.log(`Generated: ${new Date().toLocaleString()}\n`);

    console.log('┌───────────────────────────────────────────────────────────────────┐');
    console.log('│ 1. GOOGLE SEARCH CONSOLE — ORGANIC SEARCH PERFORMANCE              │');
    console.log('└───────────────────────────────────────────────────────────────────┘');
    console.log(`• Total Organic Clicks:      ${gsc.totalClicks}`);
    console.log(`• Total Search Impressions:  ${gsc.totalImpressions}`);
    console.log(`• Average Search CTR:        ${gsc.avgCtr}%`);
    console.log(`• Average Position:          ${gsc.avgPosition} (impression-weighted)`);
    console.log(`• Source / Date Window:      ${gsc.source || 'Last 28 Days'}`);
    if (gsc.queryCoverage) {
        const qc = gsc.queryCoverage;
        console.log(
            `• Query-level coverage:      ${qc.clicks}/${gsc.totalClicks} clicks ` +
            `(${(qc.clickShare * 100).toFixed(0)}%), ${qc.impressions}/${gsc.totalImpressions} impressions ` +
            `(${(qc.impressionShare * 100).toFixed(0)}%)`
        );
        console.log(`  ↳ Google withholds rare queries, so the per-query table below cannot sum to the totals above.`);
    }
    console.log('');

    console.log('Top High-Intent Search Queries:');
    gsc.topQueries.slice(0, 6).forEach((q, i) => {
        console.log(`  ${i + 1}. "${q.query.padEnd(30)}" | Clicks: ${String(q.clicks).padStart(3)} | Impr: ${String(q.impressions).padStart(4)} | Pos: ${q.position}`);
    });

    if (gsc.opportunityQueries.length > 0) {
        console.log('\n🌟 Low-Hanging SEO Opportunities (Pos 3-25, High Impressions):');
        gsc.opportunityQueries.slice(0, 4).forEach((q) => {
            console.log(`  ⭐ "${q.query.padEnd(30)}" | Impr: ${String(q.impressions).padStart(4)} | Current Pos: ${q.position} | CTR: ${q.ctr}%`);
        });
    }

    printTrendBlock(data.gscTrend);

    console.log('\n┌───────────────────────────────────────────────────────────────────┐');
    console.log('│ 3. CLOUDFLARE D1 — APP USAGE & CONVERSION FUNNEL                  │');
    console.log('└───────────────────────────────────────────────────────────────────┘');
    console.log(`• Total Tracked Events:      ${telemetry.totalEvents}`);
    console.log(`• Page Views Logged:         ${telemetry.pageViews}`);
    console.log(`• User Uploads Parsed:       ${telemetry.userParses}`);
    console.log(`• Demo Previews Loaded:      ${telemetry.sampleParses}`);
    console.log(`• Spreadsheets Exported:     ${telemetry.exportComplete} (${telemetry.conversionRate}% user conversion rate)`);
    console.log(`• User Output Satisfaction:  ${formatSatisfaction(telemetry)}\n`);

    if (Object.keys(telemetry.platformCounts).length > 0) {
        console.log('Active Platform Transformations:');
        Object.entries(telemetry.platformCounts).forEach(([platform, counts]) => {
            console.log(`  • ${platform.padEnd(16)} | Parses: ${counts.parses} | Exports: ${counts.exports}`);
        });
    }

    if (telemetry.topCountries.length > 0) {
        console.log('\nActive-user Countries (loaded data or exported; bots excluded):');
        telemetry.topCountries.forEach(c => {
            console.log(`  🌍 ${c.country.padEnd(6)} | ${c.count} event(s)`);
        });
    }

    printErrorBlock(telemetry);

    if (telemetry.recentFeedback.length > 0) {
        console.log('\nRecent User Output Feedback:');
        telemetry.recentFeedback.forEach(f => {
            const quarantined = (f as { is_sample?: number | boolean }).is_sample === 1;
            const tag = quarantined ? '🧪test ' : f.unclassified ? '❔ ' : '';
            const note = quarantined ? ' (quarantined — not counted)' : f.unclassified ? ' (unclassified — predates test flag)' : '';
            console.log(`  ${tag}${f.rating === 'positive' ? '👍' : '👎'} [${f.platform || 'general'}] ${new Date(f.timestamp).toISOString().slice(0, 10)} ${f.path || ''} "${f.comment || 'No comment'}"${note}`);
        });
    }

    printMonetizationBlock(data.monetization);

    if (recommendations.length > 0) {
        console.log('\n┌───────────────────────────────────────────────────────────────────┐');
        console.log('│ 5. STRATEGIC ACTION ITEMS FOR REPO & PROGRAMMATIC SEO             │');
        console.log('└───────────────────────────────────────────────────────────────────┘');
        recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
    }

    // Pillar 4 capture-rate reconciliation — compares CF Web Analytics vs
    // Analytics Engine vs D1 to flag whether blockers are suppressing events.
    try {
        const captureReport = await computeCaptureRate(24);
        console.log(formatCaptureRateSection(captureReport));
    } catch (err) {
        console.log('\n⚠ Capture-rate reconciliation failed:', err instanceof Error ? err.message : String(err));
    }

    console.log('======================================================================\n');
    console.log('📄 Intelligence Report Saved: performance_data/unified_analytics_latest.md');
    console.log('📁 Machine JSON Saved:       performance_data/unified_analytics_latest.json\n');
}

// Auto-run if executed directly via CLI
if (require.main === module) {
    generateUnifiedAnalyticsReport().catch(err => {
        console.error('Fatal error running unified analytics report:', err);
        process.exit(1);
    });
}
