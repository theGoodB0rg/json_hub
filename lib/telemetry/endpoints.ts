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
 *   2. Legacy workers.dev endpoint
 *      — kept as fallback during migration
 *      — ~50% blocker-blocked in production (the problem we're fixing)
 *
 * SECURITY (Oct 2026): no production URL is hardcoded here anymore. An early
 * revision defaulted LEGACY_URL to the production worker, so every clone of
 * this public repo phoned production telemetry from localhost — and our own
 * jest suite live-fired real feedback on every run via the unmocked XHR
 * fallback. Now each endpoint resolves to null unless explicitly configured:
 * same-origin first-party needs a known origin, legacy needs
 * NEXT_PUBLIC_TELEMETRY_URL at build time. Unconfigured clients no-op
 * (see isTelemetryConfigured) instead of leaking dev traffic into prod.
 *
 * In production both values come from GitHub Secrets (deploy.yml), so the
 * token can rotate without touching code. The edge worker holds the matching
 * TELEMETRY_TOKEN the same way (deploy-worker.yml --var).
 */

const BUILD_TOKEN = process.env.NEXT_PUBLIC_TELEMETRY_TOKEN || 'i';

/** Build-time legacy base URL. Never defaulted — explicit or nothing. */
function legacyBaseUrl(): string | null {
    const raw = (process.env.NEXT_PUBLIC_TELEMETRY_URL || '').trim().replace(/\/$/, '');
    return raw.length > 0 ? raw : null;
}

export interface EndpointSet {
    /** First-party ingest endpoint, or null when no origin is known (SSR/tests). */
    firstPartyIngest: string | null;
    /** First-party batch endpoint for queue flushing. */
    firstPartyBatch: string | null;
    /** First-party user-feedback endpoint. */
    firstPartyFeedback: string | null;
    /** Legacy ingest endpoint, or null unless NEXT_PUBLIC_TELEMETRY_URL is set. */
    legacyIngest: string | null;
    /** Legacy batch endpoint. */
    legacyBatch: string | null;
    /** Legacy feedback endpoint. */
    legacyFeedback: string | null;
}

export function resolveEndpoints(origin?: string): EndpointSet {
    // In the browser we always use the current origin — same-site requests
    // clear every browser's privacy heuristics. On SSR / tests we accept
    // an explicit origin arg; pass '' to force "no origin known" (fail-closed
    // path) even where window exists.
    let base = origin;
    if (base === undefined && typeof window !== 'undefined') {
        base = window.location.origin;
    }
    const sameOrigin = base ? `${base}/_i/${encodeURIComponent(BUILD_TOKEN)}` : null;
    const legacy = legacyBaseUrl();

    return {
        firstPartyIngest: sameOrigin ? `${sameOrigin}/i` : null,
        firstPartyBatch: sameOrigin ? `${sameOrigin}/b` : null,
        firstPartyFeedback: sameOrigin ? `${sameOrigin}/f` : null,
        legacyIngest: legacy ? `${legacy}/api/telemetry` : null,
        legacyBatch: legacy ? `${legacy}/api/telemetry/batch` : null,
        legacyFeedback: legacy ? `${legacy}/api/feedback` : null,
    };
}

/** True when at least one endpoint is configured. Unconfigured clients must
 *  no-op rather than invent a destination — see module comment. */
export function isTelemetryConfigured(endpoints: EndpointSet): boolean {
    return Object.values(endpoints).some((e) => typeof e === 'string' && e.length > 0);
}

function chain(...endpoints: Array<string | null>): string[] {
    return endpoints.filter((e): e is string => typeof e === 'string' && e.length > 0);
}

/**
 * Ordered list of ingest endpoints to try. Caller walks the list on failure.
 */
export function ingestFallbackChain(endpoints: EndpointSet): string[] {
    return chain(endpoints.firstPartyIngest, endpoints.legacyIngest);
}

export function batchFallbackChain(endpoints: EndpointSet): string[] {
    return chain(endpoints.firstPartyBatch, endpoints.legacyBatch);
}

export function feedbackFallbackChain(endpoints: EndpointSet): string[] {
    return chain(endpoints.firstPartyFeedback, endpoints.legacyFeedback);
}
