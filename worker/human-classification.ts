/**
 * Constants shared by the edge worker and scripts/analytics/capture-rate.ts.
 *
 * Kept in their own dependency-free module: the build type-checks anything
 * the analytics scripts import, and edge-worker.ts itself uses Workers-only
 * types that do not compile against the DOM lib.
 */

/** CF's recommended "likely human" threshold for a real bot score. */
export const HUMAN_BOT_SCORE_THRESHOLD = 30;

/**
 * Client classes that are never a human page view. The capture-rate SQL is
 * built from this list so the two definitions cannot drift.
 *   bot / automated — declared by the user-agent string
 *   prefetch        — browser speculation (Sec-Purpose / Purpose: prefetch)
 *   subrequest      — a fetch() or iframe load, not a top-level navigation
 *   nobrowser       — Chrome-looking UA without the headers every real
 *                     browser sends on navigation (scrapers, HTTP libraries)
 *   fakebrowser     — Chromium-family UA with no Sec-Fetch-* headers at all.
 *                     Chrome has sent Sec-Fetch-Mode on every navigation since
 *                     2019 (76+); a request that claims Chrome and omits them
 *                     is a scraper replaying a hand-rolled header set. Added
 *                     2026-10-17 after a scanner spoofing Mobile Chrome +
 *                     Accept-Language: en-US,en;q=0.9 (no Sec-Fetch) produced
 *                     ~70% of the "human-like" row count in one 24h window.
 */
export const NON_HUMAN_CLIENT_CLASSES = ['bot', 'automated', 'prefetch', 'subrequest', 'nobrowser', 'fakebrowser', 'other'] as const;
// 'other' — a UA naming no recognisable OS. Every browser declares one
// (Windows, Mac, Linux, Android, iOS, CrOS). Added 2026-11-17: all 226 'other'
// rows ever written to D1 were scanners, prefetch proxies and fakes, and one
// scanner put 2,888 'other' rows in a single hour, inflating Pillar 1 to 64x
// Cloudflare RUM.

/**
 * HTTP-library user agents: never a person in a browser. Shared by the edge
 * worker (pageview classification) and the telemetry worker (ingest gate) —
 * the two kept separate lists, so a scanner the ingest gate rejected was
 * still counted as a human pageview in Analytics Engine.
 */
export const SCRIPTED_UA_MARKERS = [
    'curl/',
    'python-requests',
    'python-urllib',
    'scrapy',
    'wget/',
    'go-http-client',
    'node-fetch',
    'okhttp/',
    'axios/',
    'java/',
    'httpclient',
    'dalvik/',
] as const;

export function isScriptedHttpUserAgent(ua: unknown): boolean {
    if (typeof ua !== 'string' || ua.length === 0) return false;
    const lower = ua.toLowerCase();
    return SCRIPTED_UA_MARKERS.some((sub) => lower.includes(sub));
}
