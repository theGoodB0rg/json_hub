/** Pure judgement logic for the capture-rate health check (scripts/analytics/capture-rate.ts). */

export type CaptureVerdict = 'healthy' | 'degraded' | 'unknown';

/**
 * True when the human-filtered edge count and CF RUM differ by more than 2x
 * on enough volume to rule out noise. The volume gate used to require CF > 50,
 * so 3,072 edge "humans" against 48 RUM pageviews (Nov 2026) raised nothing.
 */
export function sourcesDisagreeOnPillar1(
    cfPageviews: number | null,
    aePageviews: number | null,
    v2Dominant: boolean
): boolean {
    if (!v2Dominant || cfPageviews == null || aePageviews == null || cfPageviews === 0) return false;
    if (Math.max(cfPageviews, aePageviews) <= 50) return false;
    const r = aePageviews / cfPageviews;
    return r < 0.5 || r > 2.0;
}

/**
 * Pillar 2 is judged against CF RUM, so it only means something when RUM
 * agrees with the edge count. When they disagree, the verdict is unknown
 * rather than "healthy" off an untrustworthy denominator.
 */
export function captureVerdict(
    cfPageviews: number | null,
    d1Pageviews: number | null,
    pillar2: number | null,
    sourcesDisagree: boolean
): CaptureVerdict {
    if (cfPageviews == null || d1Pageviews == null || sourcesDisagree) return 'unknown';
    return pillar2 != null && pillar2 >= 0.70 ? 'healthy' : 'degraded';
}
