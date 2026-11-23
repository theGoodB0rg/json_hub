import { buildJourneys, describeStep, matchesFilter, summarizeJourneys, type JourneyEvent } from './journeys';

const ev = (e: Partial<JourneyEvent>): JourneyEvent => ({ event_name: 'page_view', timestamp: 0, ...e });

describe('journeys', () => {
    const events = [
        ev({ visitor_id: 'aaaaaaaa-1', session_id: 's1', timestamp: 1, country: 'ID' }),
        ev({ visitor_id: 'aaaaaaaa-1', session_id: 's1', timestamp: 2, event_name: 'parse_success', file_size_bytes: 17 * 1024 * 1024, row_count: 34000 }),
        ev({ visitor_id: 'aaaaaaaa-1', session_id: 's1', timestamp: 3, event_name: 'paywall_shown', format: 'large_file' }),
        ev({ visitor_id: 'aaaaaaaa-1', session_id: 's2', timestamp: 9, event_name: 'export_success', format: 'xlsx' }),
        ev({ visitor_id: 'bbbbbbbb-2', session_id: 's3', timestamp: 5 }),
        ev({ visitor_id: null, timestamp: 4 }),                         // no id: not guessed at
        ev({ visitor_id: 'cccccccc-3', timestamp: 6, is_sample: 1 }),   // demo traffic
    ];

    it('groups by visitor and session, oldest step first, skipping id-less and sample events', () => {
        const journeys = buildJourneys(events);
        expect(journeys.map(j => j.visitorId)).toEqual(['aaaaaaaa-1', 'bbbbbbbb-2']);
        expect(journeys[0].sessions.map(s => s.length)).toEqual([3, 1]);
        expect(journeys[0].country).toBe('ID');
    });

    it('filters and summarizes', () => {
        const journeys = buildJourneys(events);
        expect(journeys.filter(j => matchesFilter(j, 'paywall')).length).toBe(1);
        expect(journeys.filter(j => matchesFilter(j, 'big')).length).toBe(1);
        expect(summarizeJourneys(journeys, 'returning')).toEqual({ visitors: 2, returning: 1, matched: 1 });
    });

    it('describes a step with size and rows', () => {
        expect(describeStep(events[1])).toBe('parse_success (17.0 MB, 34,000 rows)');
        expect(describeStep(events[2])).toBe('paywall_shown:large_file');
    });
});
