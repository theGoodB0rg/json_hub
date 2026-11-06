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
import { createControlCharEscaper, type ControlCharEscaper } from '@/lib/parsers/controlChars';

const ctx: Worker = self as unknown as Worker;

// Imports have evaluated: lets the store tell a script that never loaded from
// a worker that died mid-file.
ctx.postMessage({ type: 'READY' });

let parser: JSONParser | null = null;
let collectedItems: unknown[] = [];
/** Top-level properties, for files whose root is an object (e.g. a Trello board). */
// One entry per top-level object. Usually one; several when the file is JSON
// Lines or back-to-back documents (log and database exports).
let rootObjects: Record<string, unknown>[] = [];
// Properties of the same top-level object share a parent; a new parent means
// the next document started.
let currentRootParent: unknown = null;
let totalBytes = 0;
let processedBytes = 0;
/** One decoder per stream: a fresh decoder per chunk corrupts any multi-byte
 *  character (accents, CJK, emoji) that straddles a chunk boundary. It also
 *  strips a leading byte-order mark once. */
let decoder: TextDecoder | null = null;
/** Escapes raw tabs/line breaks inside strings, which the tokenizer rejects. */
let escaper: ControlCharEscaper | null = null;
/** Set on the first parse error so later chunks don't report it again. */
let failed = false;
/** True while end() runs: an error there means the file stopped mid-value. */
let ending = false;
let endError: string | null = null;

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
    rootObjects = [];
    currentRootParent = null;
    decoder = new TextDecoder();
    escaper = createControlCharEscaper();
    failed = false;
    ending = false;
    endError = null;

    // Emits every top-level value: array items for an array root, property
    // values for an object root. keepStack: false keeps memory flat.
    parser = new JSONParser({
        paths: ['$.*'],
        keepStack: false,
        // Accept more than one top-level value. Without it the parser stops
        // after the first document and fails on the next one ("Unexpected '{'
        // in state ENDED"), which is how 400MB+ JSON Lines files failed.
        separator: '',
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
            if (parent !== currentRootParent) {
                currentRootParent = parent;
                rootObjects.push({});
            }
            rootObjects[rootObjects.length - 1][key] = value;
        }
    };

    // The library reports through onError rather than throwing, so a file cut
    // off mid-value (a download that stopped early) used to fail outright here
    // even when thousands of records had already parsed.
    parser.onError = (error) => {
        if (ending) {
            endError = error.message;
            return;
        }
        reportParseError(error.message);
    };

    ctx.postMessage({ type: 'STREAM_STARTED' });
}

function handleStreamChunk(chunk: ArrayBuffer) {
    if (!parser || !decoder || failed) return;

    const text = decoder.decode(chunk, { stream: true });
    processedBytes += chunk.byteLength;

    try {
        parser.write(escaper ? escaper.push(text) : text);
    } catch (error) {
        reportParseError(error instanceof Error ? error.message : 'Parse error');
    }
}

function handleStreamEnd() {
    if (!parser) return;

    if (!failed) {
        ending = true;
        try {
            const rest = decoder?.decode();
            if (rest) parser.write(escaper ? escaper.push(rest) : rest);
            parser.end();
        } catch (error) {
            endError = error instanceof Error ? error.message : 'Unexpected end of JSON input';
        }
        ending = false;
        // A truncated file ends mid-value. Keep what parsed if anything did.
        if (endError && collectedItems.length === 0 && rootObjects.length === 0) {
            reportParseError(endError);
        }
    }
    const warning = endError
        ? 'This file ends partway through the JSON, so it is probably incomplete. Everything before the cut-off was converted; check the last rows.'
        : undefined;

    if (!failed) {
        if (rootObjects.length > 1 || (rootObjects.length > 0 && collectedItems.length > 0)) {
            // Several documents: each object is a record, each array adds its items.
            const records = [...collectedItems, ...rootObjects];
            postFlattened(records, records.length, warning);
        } else if (collectedItems.length > 0) {
            postFlattened(collectedItems, collectedItems.length, warning);
        } else if (rootObjects.length === 1) {
            const { data } = smartUnwrap(rootObjects[0]);
            postFlattened(data, Array.isArray(data) ? data.length : 1, warning);
        } else {
            reportParseError('No data items found in JSON');
        }
    }

    // Cleanup
    parser = null;
    decoder = null;
    escaper = null;
    collectedItems = [];
    rootObjects = [];
    currentRootParent = null;
}

function postFlattened(data: unknown, itemCount: number, warning?: string) {
    const result = flattenJSON(data, { mode: 'flat' });
    ctx.postMessage({
        type: 'STREAM_COMPLETE',
        payload: {
            rows: result.rows,
            schema: result.schema,
            itemCount,
            warning
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
