import fs from 'fs';
import path from 'path';

interface TelemetryData {
    events: Array<{
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
    }>;
    feedback: Array<{
        id: string;
        rating: 'positive' | 'negative';
        comment?: string;
        platform?: string;
        path?: string;
        timestamp: number;
    }>;
    fetched_at: number;
}

export function analyzeTelemetry(filePath?: string) {
    const dataPath = filePath || path.resolve(process.cwd(), 'performance_data', 'telemetry_latest.json');

    if (!fs.existsSync(dataPath)) {
        console.log(`\n❌ No telemetry data found at ${dataPath}. Run 'npm run telemetry:pull' first.\n`);
        return;
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const data: TelemetryData = JSON.parse(raw);

    const { events = [], feedback = [] } = data;

    console.log(`\n======================================================`);
    console.log(`📊 JSONEXPORT.COM — LOCAL TELEMETRY & CONVERSION STATS`);
    console.log(`======================================================`);
    console.log(`Snapshot Date: ${new Date(data.fetched_at || Date.now()).toLocaleString()}`);
    console.log(`Total Events Tracked: ${events.length}`);
    console.log(`Total Feedback Submissions: ${feedback.length}\n`);

    // 1. Funnel Breakdown
    const eventCounts: Record<string, number> = {};
    for (const e of events) {
        eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
    }

    const parses = (eventCounts['parse_success'] || 0) + (eventCounts['parse_error'] || 0);
    const parseSuccess = eventCounts['parse_success'] || 0;
    const exports = eventCounts['export_success'] || 0;
    const exportErrors = eventCounts['export_error'] || 0;

    console.log(`--- [1] CORE CONVERSION FUNNEL ---`);
    console.log(`• Parse Attempts:      ${parses}`);
    console.log(`• Successful Parses:   ${parseSuccess} (${parses ? ((parseSuccess / parses) * 100).toFixed(1) : 0}%)`);
    console.log(`• Exports Completed:   ${exports} (${parseSuccess ? ((exports / parseSuccess) * 100).toFixed(1) : 0}% of parsed)`);
    console.log(`• Export Errors:       ${exportErrors}`);
    console.log(`----------------------------------\n`);

    // 2. Platform Breakdown
    const platformCounts: Record<string, { parses: number; exports: number }> = {};
    for (const e of events) {
        const p = e.platform || 'generic';
        if (!platformCounts[p]) platformCounts[p] = { parses: 0, exports: 0 };
        if (e.event_name === 'parse_success') platformCounts[p].parses++;
        if (e.event_name === 'export_success') platformCounts[p].exports++;
    }

    console.log(`--- [2] TOP PLATFORMS USED ---`);
    const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1].exports - a[1].exports);
    if (sortedPlatforms.length === 0) {
        console.log(`  (No platform-specific conversions recorded yet)`);
    } else {
        for (const [platform, stats] of sortedPlatforms.slice(0, 10)) {
            console.log(`• ${platform.padEnd(16)} | Parses: ${stats.parses.toString().padStart(4)} | Exports: ${stats.exports.toString().padStart(4)}`);
        }
    }
    console.log(`------------------------------\n`);

    // 3. User Satisfaction Feedback
    console.log(`--- [3] USER OUTPUT SATISFACTION FEEDBACK ---`);
    const positiveCount = feedback.filter((f) => f.rating === 'positive').length;
    const negativeCount = feedback.filter((f) => f.rating === 'negative').length;
    const satisfactionRate = feedback.length ? ((positiveCount / feedback.length) * 100).toFixed(1) : 'N/A';

    console.log(`• Positive Ratings (👍): ${positiveCount}`);
    console.log(`• Negative Ratings (👎): ${negativeCount}`);
    console.log(`• Output Satisfaction:  ${satisfactionRate}%\n`);

    if (feedback.length > 0) {
        console.log(`Recent User Comments:`);
        for (const f of feedback.slice(0, 5)) {
            const icon = f.rating === 'positive' ? '👍' : '👎';
            console.log(`  ${icon} [${f.platform || 'generic'}] "${f.comment || '(no comment)'}" (${new Date(f.timestamp).toLocaleDateString()})`);
        }
    }
    console.log(`---------------------------------------------\n`);

    // 4. Top Errors
    const errors = events.filter((e) => e.event_name.includes('error') || e.error_message);
    console.log(`--- [4] TOP USER ERRORS (Actionable Bug List) ---`);
    if (errors.length === 0) {
        console.log(`  ✅ Zero error events recorded.`);
    } else {
        const errorSummary: Record<string, number> = {};
        for (const err of errors) {
            const msg = err.error_message || err.error_type || 'Unknown Error';
            errorSummary[msg] = (errorSummary[msg] || 0) + 1;
        }
        for (const [msg, count] of Object.entries(errorSummary).slice(0, 5)) {
            console.log(`  ⚠️  [${count}x] ${msg}`);
        }
    }
    console.log(`======================================================\n`);
}

if (require.main === module) {
    analyzeTelemetry();
}
