/** @jest-environment jsdom */

const tracked: Array<{ name: string; payload: Record<string, unknown> }> = [];
jest.mock('@/lib/telemetry/conversion-events', () => ({
    trackConversionEvent: (name: string, payload: Record<string, unknown>) => tracked.push({ name, payload }),
}));
jest.mock('@/lib/analytics', () => ({ trackFunnelStep: jest.fn() }));

class FakeWorker {
    static instances: FakeWorker[] = [];
    onmessage: ((e: { data: unknown }) => void) | null = null;
    onerror: ((e: { message: string; preventDefault: () => void }) => void) | null = null;
    onmessageerror: (() => void) | null = null;
    terminate = jest.fn();
    postMessage = jest.fn();
    constructor() {
        FakeWorker.instances.push(this);
    }
}

function loadStore() {
    jest.resetModules();
    FakeWorker.instances = [];
    tracked.length = 0;
    (global as any).Worker = FakeWorker;
    return require('./store').useAppStore as typeof import('./store').useAppStore;
}

const parseErrors = () => tracked.filter((t) => t.name === 'parse_error');
const replyParseError = () =>
    FakeWorker.instances[0].onmessage?.({ data: { type: 'PARSE_ERROR', payload: [{ message: 'Unexpected end of JSON input' }] } });

describe('parse_error telemetry while the user is typing', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('drops auto-parse errors the user keeps editing past', () => {
        const store = loadStore();
        for (const text of ['{', '{"a"', '{"a":']) {
            store.getState().setRawInput(text);
            void store.getState().parseInput({ auto: true });
            replyParseError();
            jest.advanceTimersByTime(1000);
        }
        store.getState().setRawInput('{"a":1}');
        jest.advanceTimersByTime(10_000);

        expect(parseErrors()).toHaveLength(0);
    });

    it('reports an auto-parse error once the input settles', () => {
        const store = loadStore();
        store.getState().setRawInput('{"a":');
        void store.getState().parseInput({ auto: true });
        replyParseError();

        expect(parseErrors()).toHaveLength(0);
        jest.advanceTimersByTime(3000);
        expect(parseErrors()).toHaveLength(1);
    });

    it('reports errors from an explicit parse immediately', () => {
        const store = loadStore();
        store.getState().setRawInput('{"a":');
        void store.getState().parseInput();
        replyParseError();

        expect(parseErrors()).toHaveLength(1);
    });
});
