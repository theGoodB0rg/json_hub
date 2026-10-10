/**
 * Transport contract: each transport is a function that attempts to deliver
 * one serialized event payload to an endpoint. Returns true only if the
 * underlying API confirms delivery was initiated — never on blocker-stubbed
 * success like navigator.sendBeacon which returns true even when the request
 * is silently dropped.
 */

export interface TransportResult {
    delivered: boolean;
    // Blockers often fail silently; some give observable signals we can log.
    // Reason strings are only used for diagnostics, not control flow.
    reason?: string;
}

export interface Transport {
    name: string;
    // Return a Promise so the orchestrator can race / sequence consistently.
    send(endpoint: string, body: Uint8Array, contentType: string): Promise<TransportResult>;
    // Lightweight capability probe. False = don't bother trying.
    isAvailable(): boolean;
}
