import fs from 'fs';
import path from 'path';

/** Compact, comparable slice of one analytics run. Telemetry figures are
 *  cumulative over everything D1 holds; GSC figures cover the rolling window
 *  the run fetched. Compare telemetry as deltas, GSC as window-vs-window. */
export interface AnalyticsSnapshot {
    date: string; // YYYY-MM-DD (UTC) — one snapshot per day, last run wins
    generatedAt: string;
    gsc: { clicks: number; impressions: number; ctr: number; position: number };
    telemetry: {
        pageViews: number;
        userParses: number;
        exportComplete: number;
        parseErrors: number;
        exportErrors: number;
    };
    monetization: {
        desktopPageViews: number;
        upsellShown: number;
        checkoutClicks: number;
        desktopDownloads: number;
        activationSucceeded: number;
    };
}

const HISTORY_DIR = 'history';

export function snapshotFromReport(data: {
    generatedAt: string;
    gsc: { totalClicks: number; totalImpressions: number; avgCtr: number; avgPosition: number };
    telemetry: AnalyticsSnapshot['telemetry'] & Record<string, unknown>;
    monetization: { desktopPageViews: number; upsellShown: number; totalCheckoutClicks: number; desktopDownloads: number; activationSucceeded: number };
}): AnalyticsSnapshot {
    const t = data.telemetry;
    const m = data.monetization;
    return {
        date: new Date().toISOString().slice(0, 10),
        generatedAt: data.generatedAt,
        gsc: { clicks: data.gsc.totalClicks, impressions: data.gsc.totalImpressions, ctr: data.gsc.avgCtr, position: data.gsc.avgPosition },
        telemetry: { pageViews: t.pageViews, userParses: t.userParses, exportComplete: t.exportComplete, parseErrors: t.parseErrors, exportErrors: t.exportErrors },
        monetization: {
            desktopPageViews: m.desktopPageViews,
            upsellShown: m.upsellShown,
            checkoutClicks: m.totalCheckoutClicks,
            desktopDownloads: m.desktopDownloads,
            activationSucceeded: m.activationSucceeded,
        },
    };
}

/** Newest snapshot dated strictly before `date`, or null on a first run. */
export function loadPreviousSnapshot(outDir: string, date: string): AnalyticsSnapshot | null {
    const dir = path.join(outDir, HISTORY_DIR);
    if (!fs.existsSync(dir)) return null;
    const prior = fs.readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < date).sort();
    if (prior.length === 0) return null;
    try {
        return JSON.parse(fs.readFileSync(path.join(dir, prior[prior.length - 1]), 'utf8')) as AnalyticsSnapshot;
    } catch {
        return null;
    }
}

export function saveSnapshot(outDir: string, snap: AnalyticsSnapshot): void {
    const dir = path.join(outDir, HISTORY_DIR);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${snap.date}.json`), JSON.stringify(snap, null, 2), 'utf8');
}

function delta(now: number, before: number): string {
    const d = now - before;
    return `${d >= 0 ? '+' : ''}${Math.round(d * 100) / 100}`;
}

export function formatSnapshotComparison(now: AnalyticsSnapshot, prev: AnalyticsSnapshot | null): string {
    const lines: string[] = [];
    lines.push('\n┌───────────────────────────────────────────────────────────────────┐');
    lines.push('│ COMPARISON vs PREVIOUS SNAPSHOT                                    │');
    lines.push('└───────────────────────────────────────────────────────────────────┘');
    if (!prev) {
        lines.push(`• First snapshot saved (${now.date}). Comparison starts on the next day's run.`);
        return lines.join('\n');
    }
    lines.push(`• ${prev.date} → ${now.date}`);
    lines.push('  Search Console (rolling window, so window-vs-window):');
    lines.push(`    Clicks       ${prev.gsc.clicks} → ${now.gsc.clicks}  (${delta(now.gsc.clicks, prev.gsc.clicks)})`);
    lines.push(`    Impressions  ${prev.gsc.impressions} → ${now.gsc.impressions}  (${delta(now.gsc.impressions, prev.gsc.impressions)})`);
    lines.push(`    CTR          ${prev.gsc.ctr}% → ${now.gsc.ctr}%`);
    lines.push(`    Position     ${prev.gsc.position} → ${now.gsc.position}  (lower is better)`);
    lines.push('  App activity since the last snapshot (cumulative D1 deltas):');
    const t = now.telemetry;
    const p = prev.telemetry;
    lines.push(`    Page views   ${delta(t.pageViews, p.pageViews)}`);
    lines.push(`    User parses  ${delta(t.userParses, p.userParses)}`);
    lines.push(`    Exports      ${delta(t.exportComplete, p.exportComplete)}`);
    lines.push(`    Errors       ${delta(t.parseErrors + t.exportErrors, p.parseErrors + p.exportErrors)}`);
    lines.push('  Purchase funnel since the last snapshot:');
    const m = now.monetization;
    const q = prev.monetization;
    lines.push(`    /desktop views ${delta(m.desktopPageViews, q.desktopPageViews)} | upsells shown ${delta(m.upsellShown, q.upsellShown)} | buy clicks ${delta(m.checkoutClicks, q.checkoutClicks)}`);
    lines.push(`    downloads ${delta(m.desktopDownloads, q.desktopDownloads)} | activations ${delta(m.activationSucceeded, q.activationSucceeded)}`);
    return lines.join('\n');
}
