import { computeDesktopUsage, formatDesktopUsage } from './desktopUsage';

describe('computeDesktopUsage', () => {
    it('counts desktop events by install channel and ignores the website', () => {
        const usage = computeDesktopUsage([
            { event_name: 'page_view', referrer: 'app:store' },
            { event_name: 'parse_success', referrer: 'app:store' },
            { event_name: 'export_success', referrer: 'app:store' },
            { event_name: 'parse_success', referrer: 'app:github' },
            { event_name: 'page_view', referrer: 'www.google.com' },
            { event_name: 'page_view', referrer: '(direct)' },
        ]);
        expect(usage).toEqual({
            'app:store': { pageViews: 1, parses: 1, exports: 1 },
            'app:github': { pageViews: 0, parses: 1, exports: 0 },
        });
    });

    it('says plainly when there is no desktop data', () => {
        expect(formatDesktopUsage({})[0]).toMatch(/No desktop app events/);
    });
});
