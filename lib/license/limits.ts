/**
 * What the free tier covers. The one place these numbers live.
 *
 * 15 MB since 2026-11-22. At 50 MB (Nov 6 – Nov 22) the paywall reached about
 * 8 people in two weeks, too few to learn whether anyone will pay. In the 28
 * days to Nov 22 roughly 37 visitors loaded a file over 10 MB and 24 over
 * 20 MB, against 11 over 50 MB; the median export is 250 KB, so most search
 * visitors still never meet the limit. Everyone sees the full preview first.
 */
const FREE_EXPORT_LIMIT_MB = 15;

export const FREE_EXPORT_LIMIT_BYTES = FREE_EXPORT_LIMIT_MB * 1024 * 1024;
export const FREE_EXPORT_LIMIT_LABEL = `${FREE_EXPORT_LIMIT_MB} MB`;

/** The least a free user may export from a file over the limit. */
export const FREE_SAMPLE_ROWS = 1000;

/**
 * Records a free user may export from a file over the limit: as many as fit
 * in the free size (records assumed even-sized), never fewer than
 * FREE_SAMPLE_ROWS. A flat 1,000 rows was ~3–6% of a 17 MB file, and both
 * visitors who hit the 15 MB paywall on Nov 22–23 left without taking it.
 */
export function freeSampleRows(totalRows: number, sourceBytes: number): number {
    if (sourceBytes <= FREE_EXPORT_LIMIT_BYTES) return totalRows;
    const fit = Math.floor((totalRows * FREE_EXPORT_LIMIT_BYTES) / sourceBytes);
    return Math.min(totalRows, Math.max(FREE_SAMPLE_ROWS, fit));
}

export type PaywallReason = 'large_file' | 'batch';
