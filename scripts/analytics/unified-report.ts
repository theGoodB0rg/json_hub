import fs from 'fs';
import path from 'path';
import { pullTelemetryData } from '../pull-telemetry';
import { loadGscData, GscSummary } from './gsc-parser';

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

    // 2. Load Google Search Console Organic Intelligence
    console.log('🔍 [2/3] Parsing Google Search Console Organic Signals...');
    const gscSummary = loadGscData();

    // 3. Process Telemetry Metrics
    console.log('📊 [3/3] Cross-referencing Conversion & Organic Intelligence...\n');
    const events: TelemetryEvent[] = telemetryRaw.events || [];
    const feedback: TelemetryFeedback[] = telemetryRaw.feedback || [];

    const parseAttempts = events.filter(e => e.event_name === 'parse_start' || e.event_name === 'parse_success' || e.event_name === 'parse_error').length;
    const parseSuccess = events.filter(e => e.event_name === 'parse_success').length;
    const parseErrors = events.filter(e => e.event_name === 'parse_error').length;
    const exportComplete = events.filter(e => e.event_name === 'export_complete').length;
    const exportErrors = events.filter(e => e.event_name === 'export_error').length;

    const platformCounts: Record<string, { parses: number; exports: number }> = {};
    for (const e of events) {
        const p = (e.platform || 'general').toLowerCase();
        if (!platformCounts[p]) platformCounts[p] = { parses: 0, exports: 0 };
        if (e.event_name === 'parse_success') platformCounts[p].parses++;
        if (e.event_name === 'export_complete') platformCounts[p].exports++;
    }

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

    if (gscSummary.topPages.length > 0) {
        const topPage = gscSummary.topPages[0];
        recommendations.push(
            `Top Traffic Asset: "${topPage.page}" drives the majority of organic clicks (${topPage.clicks} clicks, ${topPage.impressions} impressions). Ensure sample tables and 1-click export CTAs remain prominent.`
        );
    }

    if (negFeedback > 0) {
        recommendations.push(
            `User Feedback Alert: ${negFeedback} negative rating(s) recorded. Review recent user notes in telemetry dashboard to address formatting edge cases.`
        );
    } else {
        recommendations.push(
            `Output Quality: 100% satisfaction recorded across user feedback submissions. Conversion flattening engine is operating cleanly.`
        );
    }

    const reportData: UnifiedReportData = {
        generatedAt: new Date().toISOString(),
        gsc: gscSummary,
        telemetry: {
            totalEvents: events.length,
            parseAttempts: parseAttempts || parseSuccess,
            parseSuccess,
            exportComplete,
            parseErrors,
            exportErrors,
            conversionRate,
            positiveFeedback: posFeedback,
            negativeFeedback: negFeedback,
            satisfactionRate,
            platformCounts,
            topErrors,
            recentFeedback: feedback.slice(0, 10)
        },
        recommendations
    };

    // Print Terminal Dashboard
    printDashboard(reportData);

    // Save outputs
    const reportMd = generateMarkdownReport(reportData);
    fs.writeFileSync(path.join(outDir, 'unified_analytics_latest.md'), reportMd, 'utf-8');
    fs.writeFileSync(path.join(outDir, 'unified_analytics_latest.json'), JSON.stringify(reportData, null, 2), 'utf-8');

    console.log(`\n📄 Intelligence Report Saved: performance_data/unified_analytics_latest.md`);
    console.log(`📁 Machine JSON Saved:       performance_data/unified_analytics_latest.json\n`);

    return reportData;
}

function printDashboard(data: UnifiedReportData) {
    const { gsc, telemetry, recommendations } = data;
    console.log('======================================================================');
    console.log('🚀 JSONEXPORT.COM — UNIFIED SEARCH & CONVERSION INTELLIGENCE DASHBOARD');
    console.log('======================================================================');
    console.log(`Generated: ${new Date(data.generatedAt).toLocaleString()}\n`);

    console.log('┌───────────────────────────────────────────────────────────────────┐');
    console.log('│ 1. GOOGLE SEARCH CONSOLE — ORGANIC SEARCH PERFORMANCE              │');
    console.log('└───────────────────────────────────────────────────────────────────┘');
    console.log(`• Total Organic Clicks:      ${gsc.totalClicks.toLocaleString()}`);
    console.log(`• Total Search Impressions:  ${gsc.totalImpressions.toLocaleString()}`);
    console.log(`• Average Search CTR:        ${gsc.avgCtr}%`);
    console.log('\nTop High-Intent Search Queries:');
    gsc.topQueries.slice(0, 6).forEach((q, i) => {
        console.log(`  ${i + 1}. "${q.query.padEnd(28)}" | Clicks: ${String(q.clicks).padStart(3)} | Impr: ${String(q.impressions).padStart(4)} | Pos: ${q.position.toFixed(1)}`);
    });

    if (gsc.opportunityQueries.length > 0) {
        console.log('\n🌟 Low-Hanging SEO Opportunities (Pos 3-25, High Impressions):');
        gsc.opportunityQueries.slice(0, 4).forEach((q, i) => {
            console.log(`  ⭐ "${q.query.padEnd(28)}" | Impr: ${String(q.impressions).padStart(4)} | Current Pos: ${q.position.toFixed(1)} | CTR: ${q.ctr}%`);
        });
    }

    console.log('\n┌───────────────────────────────────────────────────────────────────┐');
    console.log('│ 2. CLOUDFLARE D1 — APP USAGE & CONVERSION FUNNEL                  │');
    console.log('└───────────────────────────────────────────────────────────────────┘');
    console.log(`• Total Tracked Events:      ${telemetry.totalEvents}`);
    console.log(`• Parses Completed:          ${telemetry.parseSuccess}`);
    console.log(`• Spreadsheets Exported:     ${telemetry.exportComplete} (${telemetry.conversionRate}% conversion rate)`);
    console.log(`• User Output Satisfaction:  ${telemetry.satisfactionRate}% (👍 ${telemetry.positiveFeedback} | 👎 ${telemetry.negativeFeedback})`);

    const platforms = Object.entries(telemetry.platformCounts);
    if (platforms.length > 0) {
        console.log('\nActive Platform Transformations:');
        platforms.forEach(([p, stats]) => {
            console.log(`  • ${p.padEnd(16)} | Parses: ${stats.parses} | Exports: ${stats.exports}`);
        });
    }

    if (telemetry.recentFeedback.length > 0) {
        console.log('\nRecent User Output Feedback:');
        telemetry.recentFeedback.slice(0, 3).forEach(f => {
            const icon = f.rating === 'positive' ? '👍' : '👎';
            console.log(`  ${icon} [${f.platform || 'general'}] "${f.comment || 'No comment'}"`);
        });
    }

    console.log('\n┌───────────────────────────────────────────────────────────────────┐');
    console.log('│ 3. STRATEGIC ACTION ITEMS FOR REPO & PROGRAMMATIC SEO             │');
    console.log('└───────────────────────────────────────────────────────────────────┘');
    recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
    });
    console.log('======================================================================');
}

function generateMarkdownReport(data: UnifiedReportData): string {
    const { gsc, telemetry, recommendations, generatedAt } = data;

    return `# Unified Analytics & Search Intelligence Report

*Generated at: ${new Date(generatedAt).toUTCString()}*

---

## 1. Executive Summary

| Metric | Value |
| :--- | :--- |
| **Total Organic Search Clicks** | **${gsc.totalClicks.toLocaleString()}** |
| **Total Search Impressions** | **${gsc.totalImpressions.toLocaleString()}** |
| **Average Organic CTR** | **${gsc.avgCtr}%** |
| **Successful Data Parses** | **${telemetry.parseSuccess}** |
| **Spreadsheets Exported** | **${telemetry.exportComplete}** |
| **User Output Satisfaction** | **${telemetry.satisfactionRate}%** (👍 ${telemetry.positiveFeedback} / 👎 ${telemetry.negativeFeedback}) |

---

## 2. Google Search Console Organic Demand

### Top Driving Queries
| Query | Clicks | Impressions | CTR | Avg Position |
| :--- | :--- | :--- | :--- | :--- |
${gsc.topQueries.slice(0, 10).map(q => `| \`${q.query}\` | ${q.clicks} | ${q.impressions} | ${q.ctr}% | ${q.position.toFixed(1)} |`).join('\n')}

### High-Opportunity Keywords (Positions 3–25 with High Search Volume)
> [!TIP]
> These queries have significant search volume but sub-optimal click-through rates. Creating dedicated programmatic landing pages or updating title tags will rapidly drive organic traffic.

| Keyword | Impressions | Current Pos | CTR | Potential Growth Action |
| :--- | :--- | :--- | :--- | :--- |
${gsc.opportunityQueries.slice(0, 8).map(q => `| \`${q.query}\` | ${q.impressions} | ${q.position.toFixed(1)} | ${q.ctr}% | Target with custom landing page & sample data |`).join('\n')}

### Top Organic Landing Pages
| Page | Clicks | Impressions | CTR | Position |
| :--- | :--- | :--- | :--- | :--- |
${gsc.topPages.slice(0, 10).map(p => `| [${p.page}](https://jsonexport.com${p.page}) | ${p.clicks} | ${p.impressions} | ${p.ctr}% | ${p.position.toFixed(1)} |`).join('\n')}

---

## 3. In-App Conversion & Satisfaction Telemetry

- **Parse Successes**: ${telemetry.parseSuccess}
- **Exports Completed**: ${telemetry.exportComplete}
- **Funnel Conversion Rate**: ${telemetry.conversionRate}%
- **Output Satisfaction**: ${telemetry.satisfactionRate}% (${telemetry.positiveFeedback} positive, ${telemetry.negativeFeedback} negative)

### User Output Feedback
${telemetry.recentFeedback.length === 0 ? '_No user feedback submissions yet._' : telemetry.recentFeedback.map(f => `- **${f.rating === 'positive' ? '👍' : '👎'} [${f.platform || 'general'}]**: "${f.comment || 'No comment provided'}" _(${new Date(f.timestamp).toLocaleDateString()})_`).join('\n')}

---

## 4. Key Recommendations & Action Items

${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}
`;
}

if (require.main === module) {
    generateUnifiedAnalyticsReport();
}
