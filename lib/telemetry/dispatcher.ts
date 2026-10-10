/**
 * Dispatcher — stitches endpoints + transports + queue into one call site.
 *
 * The public contract (`dispatch`, `flushQueue`) is called from
 * conversion-events.ts and keeps the per-event delivery logic in one place.
 *
 * Delivery algorithm:
 *   1. Serialize the event to a Uint8Array.
 *   2. For each endpoint in the fallback chain (first-party → legacy):
 *      walk the transport chain (fetch-keepalive → xhr → image-pixel).
 *      Return on the first delivered=true.
 *   3. If no (endpoint, transport) pair succeeds, enqueue to IndexedDB and
 *      hope for better conditions on the next flush (`online` event, next
 *      successful user action, or next page load).
 *
 * Why endpoint-outer, transport-inner: the endpoint being up is the gating
 * question. Once we find a reachable endpoint, cycling transports lets us
 * work around per-transport blocking without re-trying unreachable hosts.
 */

import { sendViaChain } from './transports/orchestrator';
import type { OrchestratorResult } from './transports/orchestrator';
import { enqueue, peek, remove, trimToMax } from './queue/indexeddb-queue';

export interface DispatchInput {
    endpoints: string[];     // ordered: try first-party first
    body: Uint8Array;
    contentType: string;
}

export interface DispatchOutcome {
    delivered: boolean;
    endpoint?: string;
    transport?: string;
    queued?: boolean;
    attempts: Array<{ endpoint: string; result: OrchestratorResult }>;
}

export async function dispatch(input: DispatchInput): Promise<DispatchOutcome> {
    const attempts: DispatchOutcome['attempts'] = [];
    for (const endpoint of input.endpoints) {
        const result = await sendViaChain(endpoint, input.body, input.contentType);
        attempts.push({ endpoint, result });
        if (result.delivered) {
            return { delivered: true, endpoint, transport: result.transport, attempts };
        }
    }

    // Everything failed — stash for later. The IndexedDB queue is bounded by
    // trimToMax so a long outage doesn't fill storage indefinitely.
    const firstEndpoint = input.endpoints[0];
    const key = await enqueue({
        endpoint: firstEndpoint,
        body: input.body,
        contentType: input.contentType,
        createdAt: Date.now(),
        attempts: 0,
    });
    // Opportunistic trim — don't await it blocking the caller.
    void trimToMax();

    return { delivered: false, queued: key !== null, attempts };
}

/**
 * Flush up to `batchSize` queued events, best-effort. Called on:
 *   - `online` event (connectivity restored)
 *   - page visibility change back to visible
 *   - any successful dispatch (opportunistic drain)
 *
 * Delivered events are removed from the queue. Failed ones stay for the
 * next attempt, with their attempts counter bumped so we can expire
 * perpetually-failing events in a future enhancement.
 */
export async function flushQueue(batchSize = 20): Promise<{ attempted: number; delivered: number }> {
    const items = await peek(batchSize);
    if (items.length === 0) return { attempted: 0, delivered: 0 };

    const deliveredKeys: number[] = [];

    // Serial, not parallel: avoids thundering herd on recovery and keeps
    // "preferred transport" learning stable within the batch.
    for (const item of items) {
        if (item.key === undefined) continue;
        const result = await sendViaChain(item.endpoint, item.body, item.contentType);
        if (result.delivered) deliveredKeys.push(item.key);
    }

    await remove(deliveredKeys);
    return { attempted: items.length, delivered: deliveredKeys.length };
}
