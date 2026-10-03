import {
    trackConversionEvent,
    getTrackedConversionEvents,
    clearTrackedConversionEvents,
    sendUserFeedback,
    getTelemetryEndpoint,
    DEFAULT_TELEMETRY_URL,
    flushPendingTelemetry,
} from './conversion-events';

describe('Telemetry Conversion Events', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        clearTrackedConversionEvents();
        jest.clearAllMocks();
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 202,
                json: () => Promise.resolve({ success: true }),
            } as any)
        );
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('resolves to DEFAULT_TELEMETRY_URL when environment variable is absent', () => {
        const endpoint = getTelemetryEndpoint('/api/telemetry');
        expect(endpoint).toBe(`${DEFAULT_TELEMETRY_URL}/api/telemetry`);
    });

    it('tracks conversion event in localStorage and dispatches custom DOM event', () => {
        const eventListener = jest.fn();
        window.addEventListener('jsonexport:conversion-event', eventListener);

        trackConversionEvent('export_success', {
            platform: 'trello',
            format: 'xlsx',
            file_size_bytes: 1024,
        });

        const tracked = getTrackedConversionEvents();
        expect(tracked.length).toBe(1);
        expect(tracked[0].name).toBe('export_success');
        expect(tracked[0].payload.platform).toBe('trello');
        expect(tracked[0].payload.format).toBe('xlsx');
        expect(eventListener).toHaveBeenCalled();

        window.removeEventListener('jsonexport:conversion-event', eventListener);
    });

    it('tracks page_view event correctly', () => {
        trackConversionEvent('page_view', { path: '/converters/trello-json-to-csv' });
        const tracked = getTrackedConversionEvents();
        expect(tracked.length).toBe(1);
        expect(tracked[0].name).toBe('page_view');
        expect(tracked[0].payload.path).toBe('/converters/trello-json-to-csv');
    });

    it('limits stored events to MAX_EVENTS to avoid storage overflow', () => {
        for (let i = 0; i < 210; i++) {
            trackConversionEvent('parse_success', { index: i });
        }
        const tracked = getTrackedConversionEvents();
        expect(tracked.length).toBeLessThanOrEqual(200);
    });

    it('buffers pending events and flushes them in batch', async () => {
        trackConversionEvent('parse_start', { platform: 'shopify' });
        trackConversionEvent('parse_success', { platform: 'shopify' });

        await flushPendingTelemetry();
        expect(global.fetch).toHaveBeenCalled();
    });

    it('sends feedback payload without throwing', async () => {
        await expect(
            sendUserFeedback({
                rating: 'positive',
                platform: 'trello',
                format: 'xlsx',
                comment: 'Clean columns!',
            })
        ).resolves.not.toThrow();

        expect(global.fetch).toHaveBeenCalled();
    });

    it('handles network failures gracefully without throwing', async () => {
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.reject(new Error('Network error'))
        );

        await expect(
            sendUserFeedback({
                rating: 'negative',
                platform: 'jira',
                comment: 'Missing changelog',
            })
        ).resolves.not.toThrow();
    });

    it('filters out bot/crawler user agents from tracking conversion events', () => {
        const originalUserAgent = window.navigator.userAgent;
        try {
            Object.defineProperty(window.navigator, 'userAgent', {
                value: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
                configurable: true,
            });

            trackConversionEvent('parse_success', { platform: 'shopify' });
            const tracked = getTrackedConversionEvents();
            expect(tracked.length).toBe(0);
        } finally {
            Object.defineProperty(window.navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true,
            });
        }
    });

    it('records sample_preview event for human users', () => {
        trackConversionEvent('sample_preview', { platform: 'shopify', is_sample: true });
        const tracked = getTrackedConversionEvents();
        expect(tracked.length).toBe(1);
        expect(tracked[0].name).toBe('sample_preview');
        expect(tracked[0].payload.is_sample).toBe(true);
    });
});
