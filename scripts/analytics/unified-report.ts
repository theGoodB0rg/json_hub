import fs from 'fs';
import path from 'path';
import { pullTelemetryData } from '../pull-telemetry';
import { loadGscData, GscSummary, GscQuery, GscPage } from './gsc-parser';
import { fetchLiveGscData } from './gsc-fetcher';

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
}

interface UnifiedReportData {
    generatedAt: string;
    gsc: GscSummary;
    telemetry: {
        totalEvents: number;
        pageViews: number;
        parseAttempts: number;
        parseSuccess: number;
        exportComplete: number;
        parseErrors: number;
        exportErrors: number;
        conversionRate: number;
        positiveFeedback: number;
        negativeFeedback: number;
        satisfactionRate: number;
        platformCounts: Record<string, { parses: number; exports: number }>;
        topCountries: Array<{ country: string; count: number }>;
        topErrors: Array<{ error: string; count: number; samplePath?: string }>;
        recentFeedback: TelemetryFeedback[];
    };
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
        };

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
    const parseSuccess = events.filter(e => e.event_name === 'parse_success').length;
    const parseErrors = events.filter(e => e.event_name === 'parse_error').length;
    const exportComplete = events.filter(e => e.event_name === 'export_complete' || e.event_name === 'export_success').length;
    const exportErrors = events.filter(e => e.event_name === 'export_error').length;

    const platformCounts: Record<string, { parses: number; exports: number }> = {};
    const countryMap: Record<string, number> = {};

    for (const e of events) {
        const p = (e.platform || 'general').toLowerCase();
        if (!platformCounts[p]) platformCounts[p] = { parses: 0, exports: 0 };
        if (e.event_name === 'parse_success') platformCounts[p].parses++;
        if (e.event_name === 'export_complete' || e.event_name === 'export_success') platformCounts[p].exports++;

        if (e.country && e.country !== 'Unknown') {
            countryMap[e.country] = (countryMap[e.country] || 0) + 1;
        }
    }

    const topCountries = Object.entries(countryMap)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const posFeedback = feedback.filter(f => f.rating === 'positive').length;
    const negFeedback = feedback.filter(f => f.rating === 'negative').length;
    const totalRated = posFeedback + negFeedback;
    const satisfactionRate = totalRated > 0 ? Number(((posFeedback / totalRated) * 100).toFixed(1)) : 100;
    const conversionRate = parseSuccess > 0 ? Number(((exportComplete / parseSuccess) * 100).toFixed(1)) : 0;

    const errorMap: Record<string, { count: number; samplePath?: string }> = {};
    for (const e of events) {
        if (e.error_message || e.error_type) {
            const key = e.error_message || e.error_type || 'Unknown Error';
            if (!errorMap[key]) errorMap[key] = { count: 0, samplePath: e.path };
            errorMap[key].count++;
        }
    }
    const topErrors = Object.entries(errorMap)
        .map(([error, data]) => ({ error, count: data.count, samplePath: data.samplePath }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

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

    // Satisfaction
    if (satisfactionRate >= 90 && events.length > 0) {
        recommendations.push(
            `Output Quality: ${satisfactionRate}% satisfaction recorded across user feedback submissions. Conversion flattening engine is operating cleanly.`
        );
    } else if (satisfactionRate < 80 && totalRated > 0) {
        recommendations.push(
            `Alert: User satisfaction is at ${satisfactionRate}%. Inspect negative feedback in performance_data/telemetry_latest.json to isolate flattening bugs.`
        );
    }

    const reportData: UnifiedReportData = {
        generatedAt: new Date().toUTCString(),
        gsc: gscSummary,
        telemetry: {
            totalEvents: events.length,
            pageViews,
            parseAttempts,
            parseSuccess,
            exportComplete,
            parseErrors,
            exportErrors,
            conversionRate,
            positiveFeedback: posFeedback,
            negativeFeedback: negFeedback,
            satisfactionRate,
            platformCounts,
            topCountries,
            topErrors,
            recentFeedback: feedback.slice(0, 5),
        },
        recommendations,
    };

    // 5. Generate Formatted Output Artifacts
    const mdReport = formatMarkdownReport(reportData);
    fs.writeFileSync(path.join(outDir, 'unified_analytics_latest.md'), mdReport, 'utf8');
    fs.writeFileSync(path.join(outDir, 'unified_analytics_latest.json'), JSON.stringify(reportData, null, 2), 'utf8');

    // 6. Terminal Output Dashboard
    printTerminalDashboard(reportData);

    return reportData;
}

function formatMarkdownReport(data: UnifiedReportData): string {
    const { gsc, telemetry, recommendations, generatedAt } = data;

    return `# Unified Analytics & Search Intelligence Report

*Generated at: ${generatedAt}*

---

## 1. Executive Summary

| Metric | Value |
| :--- | :--- |
| **Total Organic Search Clicks** | **${gsc.totalClicks.toLocaleString()}** |
| **Total Search Impressions** | **${gsc.totalImpressions.toLocaleString()}** |
| **Average Organic CTR** | **${gsc.avgCtr}%** |
| **Tracked Page Views** | **${telemetry.pageViews}** |
| **Successful Data Parses** | **${telemetry.parseSuccess}** |
| **Spreadsheets Exported** | **${telemetry.exportComplete}** |
| **User Output Satisfaction** | **${telemetry.satisfactionRate}%** (👍 ${telemetry.positiveFeedback} / 👎 ${telemetry.negativeFeedback}) |

---

## 2. Google Search Console Organic Demand

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

## 3. In-App Conversion & Satisfaction Telemetry

- **Page Views**: ${telemetry.pageViews}
- **Parse Successes**: ${telemetry.parseSuccess}
- **Exports Completed**: ${telemetry.exportComplete}
- **Funnel Conversion Rate**: ${telemetry.conversionRate}%
- **Output Satisfaction**: ${telemetry.satisfactionRate}% (${telemetry.positiveFeedback} positive, ${telemetry.negativeFeedback} negative)

${telemetry.topCountries.length > 0 ? `### Geographic Breakdown
| Country | Events |
| :--- | :--- |
${telemetry.topCountries.map(c => `| ${c.country} | ${c.count} |`).join('\n')}
` : ''}

${telemetry.recentFeedback.length > 0 ? `### User Output Feedback
${telemetry.recentFeedback.map(f => `- **${f.rating === 'positive' ? '👍' : '👎'} [${f.platform || 'general'}]**: "${f.comment || 'No comment'}" _(${new Date(f.timestamp).toLocaleDateString()})_`).join('\n')}` : ''}

---

## 4. Key Recommendations & Action Items

${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}
`;
}

function printTerminalDashboard(data: UnifiedReportData): void {
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
    console.log(`• Source / Date Window:      ${gsc.source || 'Last 28 Days'}\n`);

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

    console.log('\n┌───────────────────────────────────────────────────────────────────┐');
    console.log('│ 2. CLOUDFLARE D1 — APP USAGE & CONVERSION FUNNEL                  │');
    console.log('└───────────────────────────────────────────────────────────────────┘');
    console.log(`• Total Tracked Events:      ${telemetry.totalEvents}`);
    console.log(`• Page Views Logged:         ${telemetry.pageViews}`);
    console.log(`• Parses Completed:          ${telemetry.parseSuccess}`);
    console.log(`• Spreadsheets Exported:     ${telemetry.exportComplete} (${telemetry.conversionRate}% conversion rate)`);
    console.log(`• User Output Satisfaction:  ${telemetry.satisfactionRate}% (👍 ${telemetry.positiveFeedback} | 👎 ${telemetry.negativeFeedback})\n`);

    if (Object.keys(telemetry.platformCounts).length > 0) {
        console.log('Active Platform Transformations:');
        Object.entries(telemetry.platformCounts).forEach(([platform, counts]) => {
            console.log(`  • ${platform.padEnd(16)} | Parses: ${counts.parses} | Exports: ${counts.exports}`);
        });
    }

    if (telemetry.topCountries.length > 0) {
        console.log('\nTop Visitor Countries (D1 Edge):');
        telemetry.topCountries.forEach(c => {
            console.log(`  🌍 ${c.country.padEnd(6)} | ${c.count} event(s)`);
        });
    }

    if (telemetry.recentFeedback.length > 0) {
        console.log('\nRecent User Output Feedback:');
        telemetry.recentFeedback.forEach(f => {
            console.log(`  ${f.rating === 'positive' ? '👍' : '👎'} [${f.platform || 'general'}] "${f.comment || 'No comment'}"`);
        });
    }

    if (recommendations.length > 0) {
        console.log('\n┌───────────────────────────────────────────────────────────────────┐');
        console.log('│ 3. STRATEGIC ACTION ITEMS FOR REPO & PROGRAMMATIC SEO             │');
        console.log('└───────────────────────────────────────────────────────────────────┘');
        recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
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
