'use client';

/**
 * PostExportUpsell — surfaces a dismissable Pro upsell toast at the moment
 * of highest intent: just after the user successfully exports a file.
 *
 * Shipped in M1 of MONETIZATION_ROADMAP_2026-10-10.md.
 *
 * Design decisions:
 * - Listens to the `jsonexport:conversion-event` custom DOM event that
 *   `trackConversionEvent` dispatches, so this component is zero-coupled to
 *   the store/export code paths. New export surfaces (batch, API, keyboard
 *   shortcut) get the upsell for free.
 * - Sample/demo exports (is_sample === true) are SKIPPED — users exploring
 *   demos haven't committed anything and don't deserve a sales pitch.
 * - Pro users never see it (checked at show-time against useProStore).
 * - 24-hour cooldown after shown — a user who exports five files in one
 *   session isn't shown five toasts. Dismissal and click both set the
 *   cooldown (click because they already engaged).
 * - The message follows observed behavior (see lib/growth/upsell-variant.ts):
 *   a large export, a returning exporter, or a first-time small export each
 *   get their own copy, and shown/dismissed/clicked are tagged with the
 *   variant so the report can compare them.
 * - Opens Gumroad with ?src=post_export_upsell_<variant> so revenue is
 *   attributable to this surface and variant vs the LargeFileUpsell surface.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';
import { useProStore } from '@/lib/store/proStore';
import { checkoutUrl, trackCheckoutClick } from '@/components/BuyProLink';
import {
    chooseUpsellVariant,
    checkoutSourceFor,
    formatMegabytes,
    type UpsellVariant,
} from '@/lib/growth/upsell-variant';

const COOLDOWN_KEY = 'jsonexport:post-export-upsell-last';
const EXPORT_COUNT_KEY = 'jsonexport:real-export-count';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h — one impression per day max

interface ExportDetails {
    platform?: string;
    format?: string;
    fileSizeBytes?: number;
    variant: UpsellVariant;
}

const DEFAULT_DETAILS: ExportDetails = { variant: 'first' };

interface UpsellCopy {
    title: string;
    body: ReactNode;
}

/** One message per observed behavior. Each leads with what the visitor just
 *  did, and every claim is one the desktop page already makes. */
function copyFor(details: ExportDetails): UpsellCopy {
    switch (details.variant) {
        case 'large':
            return {
                title: details.fileSizeBytes
                    ? `That was a ${formatMegabytes(details.fileSizeBytes)} MB file.`
                    : 'That was a big file.',
                body: (
                    <>
                        Big files are where the browser strains. The <strong>desktop app</strong> streams
                        1 GB+ files without freezing and converts whole folders in batch. One-time $29,
                        lifetime license.
                    </>
                ),
            };
        case 'returning':
            return {
                title: 'Converting these regularly?',
                body: (
                    <>
                        Skip the upload-and-wait loop. The <strong>desktop app</strong> batch-converts
                        folders and can watch a folder for new files, all offline. One-time $29, lifetime
                        license.
                    </>
                ),
            };
        default:
            return {
                title: 'Nice — your file’s ready.',
                body: (
                    <>
                        It never left your browser. The <strong>desktop app</strong> keeps it that way for
                        any file size, fully offline. One-time $29, lifetime license.
                    </>
                ),
            };
    }
}

function readExportCount(): number {
    try {
        return Number(window.localStorage.getItem(EXPORT_COUNT_KEY) || '0') || 0;
    } catch {
        return 0;
    }
}

function writeExportCount(n: number) {
    try {
        window.localStorage.setItem(EXPORT_COUNT_KEY, String(n));
    } catch {
        // ignore
    }
}

function readLastShown(): number {
    try {
        return Number(window.localStorage.getItem(COOLDOWN_KEY) || '0');
    } catch {
        return 0;
    }
}

function writeLastShown() {
    try {
        window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    } catch {
        // ignore
    }
}

export function PostExportUpsell() {
    const [visible, setVisible] = useState(false);
    const [details, setDetails] = useState<ExportDetails>(DEFAULT_DETAILS);
    const isPro = useProStore((s) => s.isPro);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail || detail.name !== 'export_success') return;

            // Explicitly skip sample/demo exports — the user hasn't invested
            // their own data yet, so a pitch feels pushy and lowers trust.
            if (detail.payload?.is_sample === true) return;

            // Pro users: never. Read the state fresh — the closure captures
            // isPro from render, which is correct for mount, but we also
            // defensively re-check via the store accessor below.
            if (useProStore.getState().isPro) return;

            // Count every real export, including ones the cooldown suppresses:
            // "has exported before" must not depend on having been pitched.
            const priorExports = readExportCount();
            writeExportCount(priorExports + 1);

            // Respect the cooldown so one session with many exports shows
            // the toast exactly once.
            if (Date.now() - readLastShown() < COOLDOWN_MS) return;

            const fileSizeBytes = Number(detail.payload?.file_size_bytes) || undefined;
            const variant = chooseUpsellVariant({ fileSizeBytes, priorExports });
            setDetails({
                platform: detail.payload?.platform,
                format: detail.payload?.format,
                fileSizeBytes,
                variant,
            });
            // Delay the toast a touch so it doesn't collide with the file
            // download prompt in the browser chrome.
            setTimeout(() => {
                setVisible(true);
                writeLastShown();
                // The variant rides in `format`: D1 drops unknown payload
                // keys, and this is the column checkout_clicked already uses
                // for its source, so shown/dismissed/clicked line up per variant.
                trackConversionEvent('upsell_shown', {
                    upsell_type: 'post_export',
                    platform: detail.payload?.platform,
                    format: variant,
                    file_size_bytes: fileSizeBytes,
                });
            }, 800);
        };

        window.addEventListener('jsonexport:conversion-event', handler as EventListener);
        return () => window.removeEventListener('jsonexport:conversion-event', handler as EventListener);
    }, []);

    if (!visible || isPro) return null;

    const dismiss = (reason: 'close' | 'later') => {
        setVisible(false);
        trackConversionEvent('upsell_dismissed', {
            upsell_type: 'post_export',
            platform: details.platform,
            format: details.variant,
            dismiss_reason: reason,
        });
    };

    const checkoutSource = checkoutSourceFor(details.variant);
    const copy = copyFor(details);

    const click = () => {
        trackConversionEvent('upsell_clicked', {
            upsell_type: 'post_export',
            platform: details.platform,
            format: details.variant,
        });
        trackCheckoutClick(checkoutSource);
        // Open outside the current tab so we don't interrupt the user who
        // might be about to open their fresh download.
        if (typeof window !== 'undefined') {
            window.open(checkoutUrl(checkoutSource), '_blank', 'noopener,noreferrer');
        }
        setVisible(false);
    };

    // z-[110] deliberately outranks the toast viewport's z-[100]. Both
    // surfaces anchor bottom-right, and the affiliate toast fires at parse+3s
    // with an 8s duration — so for anyone who exports within ~11s of parsing
    // (both of the real users seen on 2026-10-10 did) the toast would
    // otherwise render on top of this, burying the one CTA that earns money
    // under one that does not.
    return (
        <div
            role="dialog"
            aria-labelledby="post-export-upsell-title"
            className="fixed bottom-4 right-4 z-[110] w-[min(360px,calc(100vw-2rem))] rounded-lg border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
            <button
                type="button"
                onClick={() => dismiss('close')}
                aria-label="Dismiss upsell"
                className="absolute right-2 top-2 rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
                <X className="h-4 w-4" />
            </button>
            <h3
                id="post-export-upsell-title"
                className="pr-6 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
            >
                {copy.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                {copy.body}
            </p>
            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={click}
                    className="flex-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                    Get Desktop Pro — $29
                </button>
                <button
                    type="button"
                    onClick={() => dismiss('later')}
                    className="rounded px-3 py-1.5 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                    Later
                </button>
            </div>
        </div>
    );
}
