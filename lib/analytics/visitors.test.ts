import { classifySource, computeVisitors, computeVisitorWindow, formatVisitors, type VisitorEvent } from './visitors';

const T = (iso: string) => Date.parse(iso);
const ev = (over: Partial<VisitorEvent> & { timestamp: number }): VisitorEvent => ({
    event_name: 'page_view',
    user_agent: 'Mozilla/5.0 Chrome/131',
    ...over,
});

describe('classifySource', () => {
    it('groups referrers into the sources the report shows', () => {
        expect(classifySource(null)).toBe('direct');
        expect(classifySource('(direct)')).toBe('direct');
        expect(classifySource('https://www.google.com/')).toBe('google');
        expect(classifySource('https://www.google.co.in/')).toBe('google');
        expect(classifySource('https://gemini.google.com/')).toBe('ai assistant');
        expect(classifySource('https://chatgpt.com/')).toBe('ai assistant');
        expect(classifySource('https://cn.bing.com/')).toBe('bing');
        expect(classifySource('https://m.baidu.com/s')).toBe('other search');
        expect(classifySource('https://jsonexport.com/json-to-csv')).toBe('direct');
        expect(classifySource('https://astrum24.bitrix24.ru/')).toBe('other site');
    });
});

describe('computeVisitorWindow', () => {
    const start = T('2026-11-24T00:00:00Z');
    const end = T('2026-12-01T00:00:00Z');

    it('counts unique, active, returning and same-day repeat visitors', () => {
        const events: VisitorEvent[] = [
            // a: two days, came from Google, used the tool -> returning + active
            ev({ visitor_id: 'aaaaaaaa', session_id: 's1', referrer: 'https://www.google.com/', timestamp: T('2026-11-24T10:00:00Z') }),
            ev({ visitor_id: 'aaaaaaaa', session_id: 's1', event_name: 'parse_success', timestamp: T('2026-11-24T10:01:00Z') }),
            ev({ visitor_id: 'aaaaaaaa', session_id: 's2', timestamp: T('2026-11-25T09:00:00Z') }),
            // b: two sessions on one day, direct
            ev({ visitor_id: 'bbbbbbbb', session_id: 's3', timestamp: T('2026-11-26T08:00:00Z') }),
            ev({ visitor_id: 'bbbbbbbb', session_id: 's4', timestamp: T('2026-11-26T15:00:00Z') }),
            // c: one visit from Gemini, exported
            ev({ visitor_id: 'cccccccc', session_id: 's5', referrer: 'https://gemini.google.com/', timestamp: T('2026-11-27T12:00:00Z') }),
            ev({ visitor_id: 'cccccccc', session_id: 's5', event_name: 'export_success', timestamp: T('2026-11-27T12:02:00Z') }),
            // excluded: no id, test harness, desktop app, outside window
            ev({ timestamp: T('2026-11-27T12:00:00Z') }),
            ev({ visitor_id: 'dddddddd', session_id: 's6', user_agent: 'Mozilla/5.0 jsdom/22', timestamp: T('2026-11-27T12:00:00Z') }),
            ev({ visitor_id: 'eeeeeeee', session_id: 's7', referrer: 'app:store', timestamp: T('2026-11-27T12:00:00Z') }),
            ev({ visitor_id: 'ffffffff', session_id: 's8', timestamp: T('2026-11-20T12:00:00Z') }),
        ];
        const w = computeVisitorWindow(events, 'test', start, end);
        expect(w.uniqueVisitors).toBe(3);
        expect(w.activeVisitors).toBe(2);
        expect(w.returningVisitors).toBe(1);
        expect(w.sameDayRepeatVisitors).toBe(1);
        expect(w.firstSource).toMatchObject({ google: 1, direct: 1, 'ai assistant': 1 });
        expect(w.partial).toBe(false);
        // 8 id-capable events in window from real browsers, 7 with an id
        expect(w.idCoverage).toBeCloseTo(7 / 8);
    });

    it('takes the source from the first session, not a later one', () => {
        const w = computeVisitorWindow([
            ev({ visitor_id: 'aaaaaaaa', session_id: 's1', timestamp: T('2026-11-24T10:00:00Z') }),
            ev({ visitor_id: 'aaaaaaaa', session_id: 's2', referrer: 'https://www.google.com/', timestamp: T('2026-11-25T10:00:00Z') }),
        ], 'test', start, end);
        expect(w.firstSource.direct).toBe(1);
        expect(w.firstSource.google).toBe(0);
    });
});

describe('computeVisitors', () => {
    it('flags a month that started before ids existed and skips the earlier month', () => {
        const s = computeVisitors([], T('2026-11-28T10:00:00Z'));
        expect(s.windows.map(w => w.label)).toEqual(['2026-11 (month to date)', 'Last 7 days']);
        expect(s.windows[0].partial).toBe(true);
        expect(formatVisitors(s)[0]).toMatch(/ids only since 2026-11-23/);
    });

    it('adds the previous full month once ids cover it', () => {
        const s = computeVisitors([], T('2027-01-05T10:00:00Z'));
        expect(s.windows.map(w => w.label)).toEqual(['2026-12 (full month)', '2027-01 (month to date)', 'Last 7 days']);
        expect(s.windows.every(w => !w.partial)).toBe(true);
    });
});
