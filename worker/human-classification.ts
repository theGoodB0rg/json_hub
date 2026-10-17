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
export const NON_HUMAN_CLIENT_CLASSES = ['bot', 'automated', 'prefetch', 'subrequest', 'nobrowser', 'fakebrowser'] as const;
