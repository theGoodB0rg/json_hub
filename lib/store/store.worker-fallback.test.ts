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

const crash = (w: FakeWorker, message = '') => w.onerror?.({ message, preventDefault: () => undefined });

describe('parser worker that never starts', () => {
    it('falls back to the main thread instead of blaming file size', () => {
        const store = loadStore();
        store.getState().initWorker();
        crash(FakeWorker.instances[0]);

        expect(store.getState().parseErrors).toEqual([]);
        expect(tracked.map((t) => t.name)).toEqual(['worker_init_failed']);
        expect(tracked[0].payload.error_type).toBe('worker_unavailable');

        store.getState().setRawInput('[{"a":1},{"a":2}]');
        void store.getState().parseInput();

        expect(store.getState().isParsed).toBe(true);
        expect(store.getState().flatData).toHaveLength(2);
        expect(FakeWorker.instances).toHaveLength(1);
        expect(tracked.some((t) => t.name === 'parse_success' && t.payload.source === 'main-thread')).toBe(true);
    });

    it('finishes a parse the user already started when the worker dies on load', () => {
        const store = loadStore();
        store.getState().initWorker();
        store.getState().setRawInput('[{"a":1}]');
        void store.getState().parseInput();
        crash(FakeWorker.instances[0]);

        expect(store.getState().isLoading).toBe(false);
        expect(store.getState().flatData).toHaveLength(1);
    });
});

function fakeFile(): File {
    const cancel = jest.fn(async () => undefined);
    return {
        name: 'big.json',
        size: 6_000_000,
        stream: () => ({ getReader: () => ({ read: () => new Promise(() => undefined), cancel }) }),
        __cancel: cancel,
    } as unknown as File;
}

describe('streaming worker', () => {
    it('reports a load failure honestly and stops reading the file', () => {
        const store = loadStore();
        const file = fakeFile();
        store.getState().parseInputStreaming(file);
        crash(FakeWorker.instances[0]);

        expect(store.getState().isLoading).toBe(false);
        expect(store.getState().parseErrors[0].message).not.toMatch(/too large/);
        expect(store.getState().parseErrors[0].message).toMatch(/could not start/);
        expect((file as any).__cancel).toHaveBeenCalled();
        expect(tracked.map((t) => t.name)).toEqual(['worker_init_failed']);
        expect(tracked[0].payload.source).toBe('streaming-worker');
        expect(store.getState().streamingWorker).toBeNull();
    });

    it('keeps the too-large message when it dies after starting', () => {
        const store = loadStore();
        store.getState().parseInputStreaming(fakeFile());
        FakeWorker.instances[0].onmessage?.({ data: { type: 'READY' } });
        crash(FakeWorker.instances[0], 'Out of memory');

        expect(store.getState().parseErrors[0].message).toMatch(/too large/);
        expect(tracked[0].name).toBe('parse_error');
    });
});

describe('parser worker that dies after starting', () => {
    it('still reports the too-large message and counts a parse error', () => {
        const store = loadStore();
        store.getState().initWorker();
        FakeWorker.instances[0].onmessage?.({ data: { type: 'READY' } });
        crash(FakeWorker.instances[0], 'Out of memory');

        expect(store.getState().parseErrors[0].message).toMatch(/too large/);
        expect(tracked[0].name).toBe('parse_error');
        expect(tracked[0].payload.error_type).toBe('worker_crash');
    });
});
