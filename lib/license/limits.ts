/**
 * What the free tier covers. The one place these numbers live.
 *
 * Telemetry on 2026-11-06: 91% of successful conversions were under 10 MB and
 * 99% under 50 MB, so the limit leaves almost every search visitor untouched
 * and asks only large-file users — the ones a desktop/Pro tool actually helps
 * — to pay. They still see the full preview first.
 */
export const FREE_EXPORT_LIMIT_BYTES = 50 * 1024 * 1024;
export const FREE_EXPORT_LIMIT_LABEL = '50 MB';

/** Rows a free user may export from a file over the limit. */
export const FREE_SAMPLE_ROWS = 1000;

export type PaywallReason = 'large_file' | 'batch';
