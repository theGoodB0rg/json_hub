/**
 * Per-visitor journeys from D1 events, keyed on the random `visitor_id` the
 * client sends since Nov 2026 (lib/analytics/client-id.ts). Before that,
 * journeys had to be guessed from country + user agent, which merges
 * strangers. Events without an id (older rows, opted-out browsers, edge
 * fallbacks) are left out rather than guessed at.
 */
export interface JourneyEvent {
    event_name: string;
    timestamp: number;
    visitor_id?: string | null;
    session_id?: string | null;
    format?: string | null;
    file_size_bytes?: number | null;
    row_count?: number | null;
    country?: string | null;
    referrer?: string | null;
    is_sample?: unknown;
}

export interface Journey {
    visitorId: string;
    country: string;
    referrer: string;
    firstSeen: number;
    lastSeen: number;
    /** Events grouped by session, oldest first. */
    sessions: JourneyEvent[][];
}

export type JourneyFilter = 'paywall' | 'big' | 'buy' | 'returning' | 'all';

const isReal = (e: JourneyEvent) => !(e.is_sample === 1 || e.is_sample === true);
const MB = 1024 * 1024;

export function buildJourneys(events: JourneyEvent[]): Journey[] {
    const byVisitor = new Map<string, JourneyEvent[]>();
    for (const e of events) {
        if (!e.visitor_id || !isReal(e)) continue;
        const list = byVisitor.get(e.visitor_id) ?? [];
        list.push(e);
        byVisitor.set(e.visitor_id, list);
    }
    const journeys: Journey[] = [];
    for (const [visitorId, list] of byVisitor) {
        list.sort((a, b) => a.timestamp - b.timestamp);
        const sessions = new Map<string, JourneyEvent[]>();
        for (const e of list) {
            const key = e.session_id || 'none';
            sessions.set(key, [...(sessions.get(key) ?? []), e]);
        }
        journeys.push({
            visitorId,
            country: list[0].country || '?',
            referrer: list[0].referrer || '(direct)',
            firstSeen: list[0].timestamp,
            lastSeen: list[list.length - 1].timestamp,
            sessions: [...sessions.values()],
        });
    }
    return journeys.sort((a, b) => b.lastSeen - a.lastSeen);
}

export function matchesFilter(j: Journey, filter: JourneyFilter): boolean {
    const all = j.sessions.flat();
    switch (filter) {
        case 'paywall': return all.some(e => e.event_name.startsWith('paywall_'));
        case 'big': return all.some(e => e.event_name === 'parse_success' && (e.file_size_bytes ?? 0) > 15 * MB);
        case 'buy': return all.some(e => e.event_name === 'checkout_clicked' || e.event_name === 'upsell_clicked');
        case 'returning': return j.sessions.length > 1;
        case 'all': return true;
    }
}

/** One step as `name:format (12.3 MB, 4,500 rows)`. */
export function describeStep(e: JourneyEvent): string {
    const detail = [
        e.file_size_bytes ? `${(e.file_size_bytes / MB).toFixed(1)} MB` : '',
        e.row_count != null ? `${e.row_count.toLocaleString('en-US')} rows` : '',
    ].filter(Boolean).join(', ');
    return `${e.event_name}${e.format ? ':' + e.format : ''}${detail ? ` (${detail})` : ''}`;
}

export interface JourneySummary {
    visitors: number;
    returning: number;
    matched: number;
}

export function summarizeJourneys(journeys: Journey[], filter: JourneyFilter): JourneySummary {
    return {
        visitors: journeys.length,
        returning: journeys.filter(j => j.sessions.length > 1).length,
        matched: journeys.filter(j => matchesFilter(j, filter)).length,
    };
}
