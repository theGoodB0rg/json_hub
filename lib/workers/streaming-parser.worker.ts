/**
 * Streaming JSON Parser Worker
 * 
 * Handles large JSON files (5MB+) by parsing chunk-by-chunk
 * without loading entire file into memory.
 */

import { JSONParser } from '@streamparser/json';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';

const ctx: Worker = self as unknown as Worker;

let parser: JSONParser | null = null;
let collectedItems: unknown[] = [];
let totalBytes = 0;
let processedBytes = 0;

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
            payload: { message: error instanceof Error ? error.message : 'Unknown worker error' }
        });
    }
});

function handleStreamStart(size: number) {
    totalBytes = size;
    processedBytes = 0;
    collectedItems = [];

    // Create new parser for streaming
    parser = new JSONParser({
        paths: ['$.*'], // Emit each top-level array item
        keepStack: false, // Memory optimization
    });

    parser.onValue = ({ value, key, parent, stack }) => {
        // We're looking for top-level array items
        if (stack.length === 1 && Array.isArray(parent)) {
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
        }
    };

    parser.onError = (error) => {
        ctx.postMessage({
            type: 'PARSE_ERROR',
            payload: [{ message: error.message }]
        });
    };

    ctx.postMessage({ type: 'STREAM_STARTED' });
}

function handleStreamChunk(chunk: ArrayBuffer) {
    if (!parser) return;

    const decoder = new TextDecoder();
    const text = decoder.decode(chunk);
    processedBytes += chunk.byteLength;

    try {
        parser.write(text);
    } catch (error) {
        // Try to extract line/column from error
        const message = error instanceof Error ? error.message : 'Parse error';
        ctx.postMessage({
            type: 'PARSE_ERROR',
            payload: [{ message }]
        });
    }
}

function handleStreamEnd() {
    if (!parser) return;

    try {
        parser.end();
    } catch {
        // Ignore end errors if we already have data
    }

    // Flatten collected items
    if (collectedItems.length > 0) {
        const result = flattenJSON(collectedItems, { mode: 'flat' });

        ctx.postMessage({
            type: 'STREAM_COMPLETE',
            payload: {
                rows: result.rows,
                schema: result.schema,
                itemCount: collectedItems.length
            }
        });
    } else {
        ctx.postMessage({
            type: 'PARSE_ERROR',
            payload: [{ message: 'No data items found in JSON' }]
        });
    }

    // Cleanup
    parser = null;
    collectedItems = [];
}

function handleStandardParse(rawInput: string) {
    // Standard parsing for smaller files (same as existing parser.worker.ts)
    try {
        const data = JSON.parse(rawInput);
        const { data: unwrapped } = smartUnwrap(data);
        const result = flattenJSON(unwrapped, { mode: 'flat' });

        ctx.postMessage({
            type: 'PARSE_SUCCESS',
            payload: {
                parsedData: data,
                rows: result.rows,
                schema: result.schema
            }
        });
    } catch (error) {
        // Extract line/column from JSON parse error
        const message = error instanceof Error ? error.message : 'Parse error';
        const lineMatch = message.match(/line (\d+)/i);
        const colMatch = message.match(/column (\d+)/i) || message.match(/position (\d+)/i);

        ctx.postMessage({
            type: 'PARSE_ERROR',
            payload: [{
                message: message,
                line: lineMatch ? parseInt(lineMatch[1]) : undefined,
                column: colMatch ? parseInt(colMatch[1]) : undefined
            }]
        });
    }
}
