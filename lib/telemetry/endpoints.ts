/**
 * Endpoint resolution for the telemetry transport layer.
 *
 * SECURITY (Oct 2026): the client integrates over ONE kind of endpoint — the
 * same-origin first-party path (`/_i/<build-token>/...`) proxied by the edge
 * worker. There is deliberately:
 *
 *   - no hardcoded production URL (an early revision defaulted one, so every
 *     clone phoned production telemetry and jest live-fired feedback),
 *   - no fallback to the telemetry worker's workers.dev URL in the bundle.
 *     The Oct 18 flood proved that once a raw ingest URL ships to browsers,
 *     scanners will find it and hammer it; the only client-safe dest is an
 *     opaque same-origin path whose backend WE control. Provenance secrets
 *     live only on servers (EDGE_FALLBACK_SECRET worker-to-worker).
 *
 * The path token is build-time (deploy.yml consumes NEXT_PUBLIC_TELEMETRY_TOKEN)
 * and rotates per deploy. It is obfuscation for adblock rules and dumb
 * scanners — NOT authentication; the edge worker owns auth/z decisions.
 * Fail-closed: an unset token resolves to no endpoint at all (client no-ops)
 * rather than shipping a predictable placeholder path into production.
 */

let BUILD_TOKEN = process.env.NEXT_PUBLIC_TELEMETRY_TOKEN || '';

/** Test hook: the module caches env at load; tests need to re-seed it. */
export function _setBuildToken(token: string) {
    BUILD_TOKEN = token;
}

export interface EndpointSet {
    /** Same-origin ingest endpoint, or null when unconfigured (SSR/tests). */
    firstPartyIngest: string | null;
    /** Same-origin batch endpoint for queue flushing. */
    firstPartyBatch: string | null;
    /** Same-origin user-feedback endpoint. */
    firstPartyFeedback: string | null;
}

export function resolveEndpoints(origin?: string): EndpointSet {
    if (!BUILD_TOKEN) {
        // Fail closed: no token configured → no endpoints → client no-ops.
        return { firstPartyIngest: null, firstPartyBatch: null, firstPartyFeedback: null };
    }
    // In the browser we always use the current origin — same-site requests
    // clear every browser's privacy heuristics. On SSR / tests we accept
    // an explicit origin arg; pass '' to force "no origin known" (fail-closed
    // path) even where window exists.
    let base = origin;
    if (base === undefined && typeof window !== 'undefined') {
        base = window.location.origin;
    }
    const sameOrigin = base ? `${base}/_i/${encodeURIComponent(BUILD_TOKEN)}` : null;

    return {
        firstPartyIngest: sameOrigin ? `${sameOrigin}/i` : null,
        firstPartyBatch: sameOrigin ? `${sameOrigin}/b` : null,
        firstPartyFeedback: sameOrigin ? `${sameOrigin}/f` : null,
    };
}

/** True when at least one endpoint is configured. Unconfigured clients must
 *  no-op rather than invent a destination — see module comment. */
export function isTelemetryConfigured(endpoints: EndpointSet): boolean {
    return Object.values(endpoints).some((e) => typeof e === 'string' && e.length > 0);
}

/**
 * Ordered ingest endpoints to try. Callers walk the list on failure.
 */
export function ingestFallbackChain(endpoints: EndpointSet): string[] {
    return [endpoints.firstPartyIngest].filter((e): e is string => e != null);
}

export function batchFallbackChain(endpoints: EndpointSet): string[] {
    return [endpoints.firstPartyBatch].filter((e): e is string => e != null);
}

export function feedbackFallbackChain(endpoints: EndpointSet): string[] {
    return [endpoints.firstPartyFeedback].filter((e): e is string => e != null);
}
