/**
 * Streaming JSON Parser Worker
 * 
 * Handles large JSON files (5MB+) by parsing chunk-by-chunk
 * without loading entire file into memory.
 */

import { JSONParser } from '@streamparser/json';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import { validateAndParse } from '@/lib/parsers/smartParse';

const ctx: Worker = self as unknown as Worker;

// Imports have evaluated: lets the store tell a script that never loaded from
// a worker that died mid-file.
ctx.postMessage({ type: 'READY' });

let parser: JSONParser | null = null;
let collectedItems: unknown[] = [];
/** Top-level properties, for files whose root is an object (e.g. a Trello board). */
let rootObject: Record<string, unknown> = {};
let totalBytes = 0;
let processedBytes = 0;
/** One decoder per stream: a fresh decoder per chunk corrupts any multi-byte
 *  character (accents, CJK, emoji) that straddles a chunk boundary. It also
 *  strips a leading byte-order mark once. */
let decoder: TextDecoder | null = null;
/** Set on the first parse error so later chunks don't report it again. */
let failed = false;

function reportParseError(message: string) {
    if (failed) return;
    failed = true;
    ctx.postMessage({ type: 'PARSE_ERROR', payload: [{ message }] });
}

ctx.addEventListener('message', (event: MessageEvent) => {
    const { type, payload } = event.data as { type: string; payload?: unknown };

    try {
        switch (type) {
            case 'STREAM_START':
                handleStreamStart((payload as { totalSize: number }).totalSize);
                break;

            case 'STREAM_CHUNK':
                handleStreamChunk(payload as ArrayBuffer);
                break;

            case 'STREAM_END':
                handleStreamEnd();
                break;

            case 'PARSE_STANDARD':
                handleStandardParse(payload as string);
                break;
        }
    } catch (error) {
        ctx.postMessage({
            type: 'ERROR',
            stage: type,
            // An array, like every other error payload: the store reads [0].
            payload: [{ message: error instanceof Error ? error.message : 'Unknown worker error' }]
        });
    }
});

function handleStreamStart(size: number) {
    totalBytes = size;
    processedBytes = 0;
    collectedItems = [];
    rootObject = {};
    decoder = new TextDecoder();
    failed = false;

    // Emits every top-level value: array items for an array root, property
    // values for an object root. keepStack: false keeps memory flat.
    parser = new JSONParser({
        paths: ['$.*'],
        keepStack: false,
    });

    parser.onValue = ({ value, key, parent, stack }) => {
        if (stack.length !== 1) return;

        if (Array.isArray(parent)) {
            collectedItems.push(value);

            // Report progress every 100 items
            if (collectedItems.length % 100 === 0) {
                ctx.postMessage({
                    type: 'STREAM_PROGRESS',
                    payload: {
                        itemCount: collectedItems.length,
                        bytesProcessed: processedBytes,
                        totalBytes: totalBytes,
                        percent: Math.round((processedBytes / totalBytes) * 100)
                    }
                });
            }
        } else if (typeof key === 'string') {
            // Object root: previously dropped, so a large Trello board or API
            // envelope ({"data": [...]}) ended in "No data items found".
            rootObject[key] = value;
        }
    };

    parser.onError = (error) => reportParseError(error.message);

    ctx.postMessage({ type: 'STREAM_STARTED' });
}

function handleStreamChunk(chunk: ArrayBuffer) {
    if (!parser || !decoder || failed) return;

    const text = decoder.decode(chunk, { stream: true });
    processedBytes += chunk.byteLength;

    try {
        parser.write(text);
    } catch (error) {
        reportParseError(error instanceof Error ? error.message : 'Parse error');
    }
}

function handleStreamEnd() {
    if (!parser) return;

    if (!failed) {
        try {
            const rest = decoder?.decode();
            if (rest) parser.write(rest);
            parser.end();
        } catch (error) {
            // A truncated file ends mid-value. Keep what parsed if anything did.
            if (collectedItems.length === 0 && Object.keys(rootObject).length === 0) {
                reportParseError(error instanceof Error ? error.message : 'Unexpected end of JSON input');
            }
        }
    }

    if (!failed) {
        if (collectedItems.length > 0) {
            postFlattened(collectedItems, collectedItems.length);
        } else if (Object.keys(rootObject).length > 0) {
            const { data } = smartUnwrap(rootObject);
            postFlattened(data, Array.isArray(data) ? data.length : 1);
        } else {
            reportParseError('No data items found in JSON');
        }
    }

    // Cleanup
    parser = null;
    decoder = null;
    collectedItems = [];
    rootObject = {};
}

function postFlattened(data: unknown, itemCount: number) {
    const result = flattenJSON(data, { mode: 'flat' });
    ctx.postMessage({
        type: 'STREAM_COMPLETE',
        payload: {
            rows: result.rows,
            schema: result.schema,
            itemCount
        }
    });
}

function handleStandardParse(rawInput: string) {
    // Same input handling as parser.worker.ts (BOM, JSON Lines, format hints).
    const parsed = validateAndParse(rawInput);
    if (!parsed.success) {
        ctx.postMessage({ type: 'PARSE_ERROR', payload: parsed.errors });
        return;
    }

    const { data: unwrapped } = smartUnwrap(parsed.data);
    const result = flattenJSON(unwrapped, { mode: 'flat' });

    ctx.postMessage({
        type: 'PARSE_SUCCESS',
        payload: {
            parsedData: parsed.data,
            rows: result.rows,
            schema: result.schema
        }
    });
}
