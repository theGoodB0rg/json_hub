import type { Transport, TransportResult } from './types';
import { fetchKeepaliveTransport } from './fetch-keepalive';
import { xhrAsyncTransport } from './xhr-async';
import { imagePixelTransport } from './image-pixel';

/**
 * Transport orchestrator — tries transports in order, remembers the winner.
 *
 * The chain is ordered by expected success rate on blocker-equipped browsers:
 *   1. fetch(keepalive) — modern primary, usually works
 *   2. xhr                — older API, blocked less often by neutralization lists
 *   3. image-pixel        — survives when all JS network APIs are blocked
 *
 * Once a transport delivers successfully, we bias toward it on subsequent
 * calls (skip earlier transports) to avoid the latency of retrying the
 * blocked one every time. The bias is session-scoped (module variable) —
 * fresh page loads start from the top, which is fine because capability
 * can change between sessions (new extension installed, etc.).
 */

const CHAIN: Transport[] = [fetchKeepaliveTransport, xhrAsyncTransport, imagePixelTransport];

// Index of the transport that last delivered successfully.
// -1 means "no winner yet, start from the top".
let preferredIndex = -1;

export interface OrchestratorResult {
    delivered: boolean;
    transport: string;
    attempts: Array<{ transport: string; result: TransportResult }>;
}

export async function sendViaChain(
    endpoint: string,
    body: Uint8Array,
    contentType: string
): Promise<OrchestratorResult> {
    const attempts: OrchestratorResult['attempts'] = [];

    // Start at the known-good index when we have one.
    const startAt = preferredIndex >= 0 ? preferredIndex : 0;

    // Try from startAt to end, then wrap back to try earlier ones (in case
    // the preferred transport broke since last success).
    const order: number[] = [];
    for (let i = startAt; i < CHAIN.length; i++) order.push(i);
    for (let i = 0; i < startAt; i++) order.push(i);

    for (const idx of order) {
        const t = CHAIN[idx];
        if (!t.isAvailable()) continue;
        const result = await t.send(endpoint, body, contentType);
        attempts.push({ transport: t.name, result });
        if (result.delivered) {
            preferredIndex = idx;
            return { delivered: true, transport: t.name, attempts };
        }
    }

    return { delivered: false, transport: 'none', attempts };
}

/**
 * Test / diagnostics hook: reset the learned preference so the next send
 * starts from the top of the chain. Used in tests to verify the fallback
 * actually works.
 */
export function _resetPreference() {
    preferredIndex = -1;
}

export function _currentPreference(): string | null {
    return preferredIndex >= 0 ? CHAIN[preferredIndex].name : null;
}
