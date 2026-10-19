/**
 * Regression tests for server-side sample quarantine.
 *
 * Oct 2026: jsdom QA probes arrived with is_sample = 0 and were stored as
 * genuine, pinning satisfaction at 0%. The client now auto-flags automation,
 * but the worker must not trust the client flag alone — a forged or missing
 * flag (or a direct API post) must still land quarantined. These tests pin
 * both the pure classifier and its wiring into the request handlers.
 *
 * Note: this jsdom build provides no Request/Response globals, so the tests
 * use minimal fakes covering exactly what the handler touches (method, url,
 * headers.get, json). This keeps the worker dependency-free and the tests
 * hermetic.
 */
import worker, {
    isAutomationUserAgent,
    isScriptedHttpUserAgent,
    resolveServerSampleFlag,
} from './telemetry-worker';

const JSDOM_UA = 'Mozilla/5.0 (win32) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/20.0.3';
const CHROME_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';

// Minimal Response for jsdom builds without fetch globals — covers exactly
// what the handler's jsonResponse() touches (status + json body).
if (typeof (globalThis as any).Response === 'undefined') {
    (globalThis as any).Response = class {
        status: number;
        private payload: string;
        constructor(body?: any, init?: any) {
            this.payload = typeof body === 'string' ? body : '';
            this.status = init?.status ?? 200;
        }
        async json() {
            return JSON.parse(this.payload);
        }
    };
}

// jsdom's crypto lacks randomUUID (Workers runtime has it; ingest IDs fall
// back to it when the event body has none). Deterministic stub via
// defineProperty — a plain assignment silently no-ops against jsdom's
// read-only crypto global.
const _cryptoAny = globalThis.crypto as any;
if (typeof _cryptoAny?.randomUUID !== 'function') {
    let idSeq = 0;
    Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        get: () => ({
            ...(_cryptoAny || {}),
            randomUUID: () => `test-uuid-${(++idSeq).toString(16).padStart(8, '0')}`,
        }),
    });
}

function mockEnv() {
    const runs: any[][] = [];
    const batches: any[] = [];
    const pending: Promise<any>[] = [];
    const env = {
        EDGE_FALLBACK_SECRET: 'test-secret-abc123',
        DB: {
            prepare: jest.fn((_sql: string) => ({
                bind: jest.fn((...args: any[]) => {
                    runs.push(args);
                    return { run: jest.fn().mockResolvedValue({ success: true }) };
                }),
            })),
            batch: jest.fn(async (stmts: any[]) => {
                batches.push(stmts);
                return [];
            }),
        },
    };
    const ctx = { waitUntil: jest.fn((p: Promise<any>) => { pending.push(p); }) };
    return { env: env as any, ctx: ctx as any, runs, batches, pending };
}

function postFeedback(body: any, userAgent: string) {
    return {
        method: 'POST',
        url: 'https://telemetry.test/api/feedback',
        headers: {
            get: (name: string) =>
                name.toLowerCase() === 'user-agent' ? userAgent
                : name.toLowerCase() === 'content-type' ? 'application/json'
                : null,
        },
        json: async () => body,
    } as unknown as Request;
}

function postIngest(events: any | any[], userAgent: string, extraHeaders: Record<string, string> = {}) {
    const known: Record<string, string> = {
        'user-agent': userAgent,
        'content-type': 'application/json',
        'content-length': JSON.stringify(events).length.toString(10),
        ...extraHeaders,
    };
    return {
        method: 'POST',
        url: 'https://telemetry.test/api/telemetry',
        headers: {
            get: (name: string) => known[name.toLowerCase()] ?? null,
        },
        json: async () => events,
    } as unknown as Request;
}

describe('worker automation quarantine', () => {
    it('classifies the jsdom probe UA as automation and real browsers as genuine', () => {
        expect(isAutomationUserAgent(JSDOM_UA)).toBe(true);
        expect(isAutomationUserAgent('HeadlessChrome/120 test-client playwright')).toBe(true);
        expect(isAutomationUserAgent(CHROME_UA)).toBe(false);
        expect(isAutomationUserAgent('')).toBe(false);
        expect(isAutomationUserAgent(null)).toBe(false);
    });

    it('ORs the client flag with the UA signal — either quarantines', () => {
        expect(resolveServerSampleFlag(0, CHROME_UA)).toBe(0);
        expect(resolveServerSampleFlag(1, CHROME_UA)).toBe(1);
        expect(resolveServerSampleFlag(true, CHROME_UA)).toBe(1);
        // The Oct 2026 case: harness forgot the flag, UA still catches it.
        expect(resolveServerSampleFlag(0, JSDOM_UA)).toBe(1);
        expect(resolveServerSampleFlag(undefined, JSDOM_UA)).toBe(1);
    });

    it('forces is_sample = 1 for automation feedback even when the client says 0', async () => {
        const { env, ctx, runs, pending } = mockEnv();
        const res = await (worker as any).fetch(
            postFeedback({ id: 'probe-1', rating: 'negative', comment: 'Missing changelog', platform: 'jira', is_sample: 0 }, JSDOM_UA),
            env,
            ctx
        );
        expect(res.status).toBe(202);
        await Promise.all(pending);
        expect(runs.length).toBe(1);
        // bind order: id, rating, comment, platform, format, path, timestamp, is_sample
        expect(runs[0][1]).toBe('negative');
        expect(runs[0][7]).toBe(1);
    });

    it('leaves genuine feedback untouched', async () => {
        const { env, ctx, runs, pending } = mockEnv();
        await (worker as any).fetch(
            postFeedback({ id: 'real-1', rating: 'positive', platform: 'trello', is_sample: 0 }, CHROME_UA),
            env,
            ctx
        );
        await Promise.all(pending);
        expect(runs.length).toBe(1);
        expect(runs[0][7]).toBe(0);
    });

    it('honours an honest client sample flag from a real browser', async () => {
        const { env, ctx, runs, pending } = mockEnv();
        await (worker as any).fetch(
            postFeedback({ id: 'demo-1', rating: 'positive', platform: 'trello', is_sample: 1 }, CHROME_UA),
            env,
            ctx
        );
        await Promise.all(pending);
        expect(runs[0][7]).toBe(1);
    });

    it('never uses country for classification — NG harness and NG users differ by UA only', () => {
        // Country is edge-derived and identical for both; the classifier
        // takes only (clientFlag, userAgent), so this is structural: the
        // function signature itself excludes country.
        expect(resolveServerSampleFlag.length).toBe(2);
        expect(resolveServerSampleFlag(0, CHROME_UA)).toBe(0);
    });
});

describe('Oct-18 ingest hardening — provenance and scripted-UA gates', () => {
    it('INSERTS a genuine browser page_view through the legacy-style endpoint unchanged', async () => {
        const { env, ctx, batches } = mockEnv();
        const res = await (worker as any).fetch(
            postIngest({ event_name: 'page_view', path: '/', is_sample: 0 }, CHROME_UA),
            env,
            ctx
        );
        expect(res.status).toBe(202);
        await Promise.all(ctx.waitUntil.mock.calls.map((c: any) => c[0]));
        expect(batches.length).toBe(1);
        expect(batches[0].length).toBe(1);
    });

    it('imports the scripted-UA classifier and rejects the classic offenders', () => {
        expect(isScriptedHttpUserAgent('curl/8.7.1')).toBe(true);
        expect(isScriptedHttpUserAgent('python-requests/2.31.0')).toBe(true);
        expect(isScriptedHttpUserAgent('Wget/1.21.1')).toBe(true);
        expect(isScriptedHttpUserAgent('Go-http-client/2.0')).toBe(true);
        expect(isScriptedHttpUserAgent('Scrapy/2.17.0 (+https://scrapy.org)')).toBe(true);
        expect(isScriptedHttpUserAgent(CHROME_UA)).toBe(false);
        expect(isScriptedHttpUserAgent(' iPhone OS 13_2_3 Safari/604.1 ')).toBe(false);
        expect(isScriptedHttpUserAgent('')).toBe(false);
        expect(isScriptedHttpUserAgent(null)).toBe(false);
    });

    it('REGRESSION 2026-10-18: rejects the whole batch when a curl flood POSTs events', async () => {
        const { env, ctx, batches } = mockEnv();
        const res = await (worker as any).fetch(
            postIngest([{ event_name: 'page_view', path: '/' }, { event_name: 'parse_success' }], 'curl/8.7.1'),
            env,
            ctx
        );
        expect(res.status).toBe(403);
        await Promise.all(ctx.waitUntil.mock.calls.map((c: any) => c[0]));
        expect(batches.length).toBe(0);
    });

    it('rejects a scripted-UA feedback POST too', async () => {
        const { env, ctx, runs } = mockEnv();
        const res = await (worker as any).fetch(
            postFeedback({ id: 'spam-1', rating: 'negative', comment: 'junk' }, 'python-requests/2.31.0'),
            env,
            ctx
        );
        expect(res.status).toBe(403);
        expect(runs.length).toBe(0);
    });

    it('stores a normal edge-fallback batch that carries the provenance secret', async () => {
        const { env, ctx, batches, runs } = mockEnv();
        const res = await (worker as any).fetch(
            postIngest(
                { event_name: 'page_view_edge', path: '/', error_type: 'edge:bot_score=0;src=0;ua=desktop', is_sample: 0 },
                CHROME_UA,
                { 'x-edge-secret': 'test-secret-abc123', 'x-source': 'edge-worker' }
            ),
            env,
            ctx
        );
        expect(res.status).toBe(202);
        await Promise.all(ctx.waitUntil.mock.calls.map((c: any) => c[0]));
        expect(batches.length).toBe(1);
        // is_sample must survive the edge contract: server rows are genuine.
        // Mock records each statement's bind args; column 13 (0-based) is is_sample.
        expect(runs[0][13]).toBe(0);
    });

    it('REGRESSION: rejects page_view_edge WITHOUT the provenance secret header', async () => {
        const { env, ctx, batches } = mockEnv();
        const res = await (worker as any).fetch(
            postIngest({ event_name: 'page_view_edge', path: '/', is_sample: 0 }, CHROME_UA),
            env,
            ctx
        );
        expect(res.status).toBe(403);
        expect(batches.length).toBe(0);
    });

    it('rejects page_view_edge when the secret is present but WRONG', async () => {
        const { env, ctx, batches } = mockEnv();
        const res = await (worker as any).fetch(
            postIngest({ event_name: 'page_view_edge', path: '/' }, CHROME_UA, { 'x-edge-secret': 'wrong-value' }),
            env,
            ctx
        );
        expect(res.status).toBe(403);
        expect(batches.length).toBe(0);
    });

    it('fail-closed: rejects page_view_edge when the telemetry worker itself has no secret', async () => {
        const { env, ctx, batches } = mockEnv();
        delete (env as any).EDGE_FALLBACK_SECRET;
        const res = await (worker as any).fetch(
            postIngest({ event_name: 'page_view_edge', path: '/' }, CHROME_UA, { 'x-edge-secret': 'test-secret-abc123' }),
            env,
            ctx
        );
        expect(res.status).toBe(403);
        expect(batches.length).toBe(0);
    });

    it('zeroes out a MIXED batch where a forged edge event rides along real ones', async () => {
        // A batch containing one forged page_view_edge and one real human
        // page_view is rejected as a whole — partial acceptance would reward
        // smuggling the forged row among honest ones.
        const { env, ctx, batches } = mockEnv();
        const res = await (worker as any).fetch(
            postIngest(
                [{ event_name: 'page_view', path: '/' }, { event_name: 'page_view_edge', path: '/' }],
                CHROME_UA
            ),
            env,
            ctx
        );
        expect(res.status).toBe(403);
        expect(batches.length).toBe(0);
    });
});
