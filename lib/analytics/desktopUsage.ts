/**
 * Desktop app usage, split by install channel. The app tags every event's
 * `referrer` with app:store / app:github (app:desktop before the channel is
 * known); see lib/platform/siteOrigin.ts. Desktop events only exist from the
 * Nov 2026 build on — earlier builds sent nothing.
 */

export interface DesktopUsageEvent {
    event_name: string;
    referrer?: string | null;
}

export type DesktopUsage = Record<string, { pageViews: number; parses: number; exports: number }>;

export function computeDesktopUsage(events: DesktopUsageEvent[]): DesktopUsage {
    const usage: DesktopUsage = {};
    for (const e of events) {
        if (!e.referrer?.startsWith('app:')) continue;
        const c = (usage[e.referrer] ??= { pageViews: 0, parses: 0, exports: 0 });
        if (e.event_name === 'page_view') c.pageViews++;
        else if (e.event_name === 'parse_success') c.parses++;
        else if (e.event_name === 'export_success') c.exports++;
    }
    return usage;
}

export function formatDesktopUsage(usage: DesktopUsage): string[] {
    const rows = Object.entries(usage);
    if (rows.length === 0) return ['No desktop app events yet (builds before Nov 2026 sent no telemetry).'];
    return rows.map(([ch, u]) => `${ch.padEnd(12)} views ${u.pageViews} | parses ${u.parses} | exports ${u.exports}`);
}
