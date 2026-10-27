/**
 * Picks which post-export upsell a visitor sees, from what they just did.
 *
 * Why this exists: the single "1 GB+ files, batch, folder-watch" pitch was
 * shown 68 times and earned no tracked click, while real exports have a median
 * of ~140 KB and a p90 of ~3.5 MB. The pitch described a need almost nobody
 * had. Each variant now leads with the thing that visitor demonstrably did.
 *
 * Pure so the thresholds are testable. The variant name doubles as the
 * telemetry tag: D1 keeps only fixed columns, so it rides in `format`, the
 * same way `checkout_clicked` carries its source.
 */

export type UpsellVariant = 'large' | 'returning' | 'first';

/** Where the browser starts to feel slow on a conversion. Well under the
 *  10 MB LargeFileUpsell gate, which fires before processing and not after. */
export const LARGE_EXPORT_BYTES = 1024 * 1024;

export const UPSELL_VARIANTS: readonly UpsellVariant[] = ['large', 'returning', 'first'];

export interface UpsellSignals {
    /** Size of the file just exported, when known. */
    fileSizeBytes?: number;
    /** Real (non-sample) exports this browser completed before this one. */
    priorExports: number;
}

/** Size wins over history: a big file is the strongest signal that the
 *  browser is the bottleneck, whatever the visitor's history. */
export function chooseUpsellVariant({ fileSizeBytes, priorExports }: UpsellSignals): UpsellVariant {
    if (typeof fileSizeBytes === 'number' && fileSizeBytes >= LARGE_EXPORT_BYTES) return 'large';
    if (priorExports >= 1) return 'returning';
    return 'first';
}

export function checkoutSourceFor(variant: UpsellVariant): string {
    return `post_export_upsell_${variant}`;
}

export function isUpsellVariant(value: unknown): value is UpsellVariant {
    return typeof value === 'string' && (UPSELL_VARIANTS as readonly string[]).includes(value);
}

export function formatMegabytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return mb >= 100 ? mb.toFixed(0) : mb.toFixed(1);
}
