/**
 * Drives the streaming worker through its message protocol, the way the store
 * does for files over the streaming threshold.
 */
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';

type Message = { type: string; payload?: any };

// jsdom has neither; the worker decodes with TextDecoder.
Object.assign(globalThis, { TextEncoder: NodeTextEncoder, TextDecoder: NodeTextDecoder });
const realSelf = Object.getOwnPropertyDescriptor(globalThis, 'self');

function loadWorker() {
    const posted: Message[] = [];
    let handler: ((event: { data: Message }) => void) | null = null;
    const fakeSelf = {
        postMessage: (msg: Message) => posted.push(msg),
        addEventListener: (_type: string, fn: typeof handler) => {
            handler = fn;
        },
    };
    // In jsdom `self` is the window; the worker module reads it at load time.
    Object.defineProperty(globalThis, 'self', { value: fakeSelf, configurable: true, writable: true });
    jest.isolateModules(() => {
        require('./streaming-parser.worker');
    });
    const send = (msg: Message) => handler!({ data: msg });
    return {
        posted,
        run(text: string, chunkSize = 7) {
            const bytes = new TextEncoder().encode(text);
            send({ type: 'STREAM_START', payload: { totalSize: bytes.length } });
            for (let i = 0; i < bytes.length; i += chunkSize) {
                send({ type: 'STREAM_CHUNK', payload: bytes.slice(i, i + chunkSize).buffer });
            }
            send({ type: 'STREAM_END' });
            return posted.find((m) => m.type === 'STREAM_COMPLETE' || m.type === 'PARSE_ERROR')!;
        },
    };
}

afterEach(() => {
    if (realSelf) Object.defineProperty(globalThis, 'self', realSelf);
});

describe('streaming parser worker', () => {
    it('reads a plain array of records', () => {
        const result = loadWorker().run('[{"a":1},{"a":2},{"a":3}]');
        expect(result.type).toBe('STREAM_COMPLETE');
        expect(result.payload.itemCount).toBe(3);
    });

    it('reads JSON Lines: one record per object, not one merged object', () => {
        const result = loadWorker().run('{"id":1,"msg":"a"}\n{"id":2,"msg":"b"}\n{"id":3,"msg":"c"}\n');
        expect(result.type).toBe('STREAM_COMPLETE');
        expect(result.payload.itemCount).toBe(3);
        expect(result.payload.rows.map((r: any) => r.id)).toEqual([1, 2, 3]);
    });

    it('reads back-to-back pretty-printed documents', () => {
        const doc = (id: number) => JSON.stringify({ id, nested: { ok: true } }, null, 2);
        const result = loadWorker().run(`${doc(1)}\n${doc(2)}`);
        expect(result.type).toBe('STREAM_COMPLETE');
        expect(result.payload.itemCount).toBe(2);
    });

    it('joins paginated arrays saved one after another', () => {
        const result = loadWorker().run('[{"p":1},{"p":1}]\n[{"p":2}]');
        expect(result.type).toBe('STREAM_COMPLETE');
        expect(result.payload.itemCount).toBe(3);
    });

    it('still unwraps a single API envelope object', () => {
        const result = loadWorker().run('{"data":[{"x":1},{"x":2}],"meta":{"page":1}}');
        expect(result.type).toBe('STREAM_COMPLETE');
        expect(result.payload.rows).toHaveLength(2);
    });

    it('keeps what parsed from a truncated file', () => {
        const result = loadWorker().run('[{"a":1},{"a":2},{"a":');
        expect(result.type).toBe('STREAM_COMPLETE');
        expect(result.payload.itemCount).toBe(2);
        expect(result.payload.warning).toMatch(/incomplete/);
    });

    it('does not warn about a complete file', () => {
        const result = loadWorker().run('[{"a":1}]');
        expect(result.payload.warning).toBeUndefined();
    });

    it('still fails a file with nothing parseable', () => {
        const result = loadWorker().run('[{"a":');
        expect(result.type).toBe('PARSE_ERROR');
    });
});

describe('streaming parser worker: raw control characters', () => {
    it('reads tabs and line breaks inside strings, even split across chunks', () => {
        const text = '[{"note":"first\tline\nsecond line"},{"note":"ok"}]';
        // Chunk size 3 splits the string, and the escapes, across many chunks.
        const result = loadWorker().run(text, 3);
        expect(result.type).toBe('STREAM_COMPLETE');
        expect(result.payload.rows[0].note).toBe('first\tline\nsecond line');
    });
});
