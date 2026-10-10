/**
 * Endpoint resolution for the telemetry transport layer.
 *
 * We try endpoints in order and remember the first that answered successfully
 * this session, so each page load converges on the one that works. Priorities:
 *
 *   1. First-party path on jsonexport.com (`/_i/<build-token>/i`)
 *      — same-origin, opaque path, doesn't match blocker filter rules
 *      — fastest and lowest-blocker-rate once CF proxy is enabled
 *
 *   2. Legacy workers.dev endpoint (`https://jsonexport-telemetry.*.workers.dev/api/telemetry`)
 *      — kept as fallback during migration
 *      — ~50% blocker-blocked in production (the problem we're fixing)
 *
 * The build-time token (NEXT_PUBLIC_TELEMETRY_TOKEN) rotates each deploy,
 * so adblock lists can't match a stable pattern. If unset, we fall back to
 * a hardcoded label so dev still works.
 *
 * The ordering is important: first-party first means that in the common case
 * we never hit the legacy endpoint at all, which reduces blocker exposure
 * even for users on the subset of blocklists that catch the fallback.
 */

const BUILD_TOKEN = process.env.NEXT_PUBLIC_TELEMETRY_TOKEN || 'i';
const LEGACY_URL = process.env.NEXT_PUBLIC_TELEMETRY_URL || 'https://jsonexport-telemetry.idowue93.workers.dev';

export interface EndpointSet {
    /** First-party ingest endpoint. Same-origin when the site is served from CF. */
    firstPartyIngest: string;
    /** First-party batch endpoint for queue flushing. */
    firstPartyBatch: string;
    /** First-party user-feedback endpoint. */
    firstPartyFeedback: string;
    /** Legacy ingest endpoint (keep as fallback until migration complete). */
    legacyIngest: string;
    /** Legacy batch endpoint. */
    legacyBatch: string;
    /** Legacy feedback endpoint. */
    legacyFeedback: string;
}

export function resolveEndpoints(origin?: string): EndpointSet {
    // In the browser we always use the current origin — same-site requests
    // clear every browser's privacy heuristics. On SSR / tests we accept
    // an explicit origin arg.
    let base = origin;
    if (!base && typeof window !== 'undefined') {
        base = window.location.origin;
    }
    const sameOrigin = base ? `${base}/_i/${encodeURIComponent(BUILD_TOKEN)}` : null;

    return {
        firstPartyIngest: sameOrigin ? `${sameOrigin}/i` : LEGACY_URL + '/api/telemetry',
        firstPartyBatch: sameOrigin ? `${sameOrigin}/b` : LEGACY_URL + '/api/telemetry/batch',
        firstPartyFeedback: sameOrigin ? `${sameOrigin}/f` : LEGACY_URL + '/api/feedback',
        legacyIngest: `${LEGACY_URL}/api/telemetry`,
        legacyBatch: `${LEGACY_URL}/api/telemetry/batch`,
        legacyFeedback: `${LEGACY_URL}/api/feedback`,
    };
}

/**
 * Ordered list of ingest endpoints to try. Caller walks the list on failure.
 */
export function ingestFallbackChain(endpoints: EndpointSet): string[] {
    return [endpoints.firstPartyIngest, endpoints.legacyIngest];
}

export function batchFallbackChain(endpoints: EndpointSet): string[] {
    return [endpoints.firstPartyBatch, endpoints.legacyBatch];
}

export function feedbackFallbackChain(endpoints: EndpointSet): string[] {
    return [endpoints.firstPartyFeedback, endpoints.legacyFeedback];
}
