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
 * - Opens Gumroad with ?src=post_export_upsell so revenue is attributable
 *   to this surface vs the LargeFileUpsell surface in future reporting.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';
import { useProStore } from '@/lib/store/proStore';

const COOLDOWN_KEY = 'jsonexport:post-export-upsell-last';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h — one impression per day max
const GUMROAD_URL = 'https://pro.jsonexport.com/l/json_hub?src=post_export_upsell';

interface ExportDetails {
    platform?: string;
    format?: string;
    fileSizeBytes?: number;
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
    const [details, setDetails] = useState<ExportDetails>({});
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

            // Respect the cooldown so one session with many exports shows
            // the toast exactly once.
            if (Date.now() - readLastShown() < COOLDOWN_MS) return;

            setDetails({
                platform: detail.payload?.platform,
                format: detail.payload?.format,
                fileSizeBytes: detail.payload?.file_size_bytes,
            });
            // Delay the toast a touch so it doesn't collide with the file
            // download prompt in the browser chrome.
            setTimeout(() => {
                setVisible(true);
                writeLastShown();
                trackConversionEvent('upsell_shown', {
                    upsell_type: 'post_export',
                    platform: detail.payload?.platform,
                    format: detail.payload?.format,
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
            dismiss_reason: reason,
        });
    };

    const click = () => {
        trackConversionEvent('upsell_clicked', {
            upsell_type: 'post_export',
            platform: details.platform,
            format: details.format,
        });
        // Open outside the current tab so we don't interrupt the user who
        // might be about to open their fresh download.
        if (typeof window !== 'undefined') {
            window.open(GUMROAD_URL, '_blank', 'noopener,noreferrer');
        }
        setVisible(false);
    };

    return (
        <div
            role="dialog"
            aria-labelledby="post-export-upsell-title"
            className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
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
                Nice — your file&apos;s ready.
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                Converting a lot more? The <strong>desktop app</strong> handles 1 GB+ files, batch
                mode, and folder-watch. One-time $9, lifetime license.
            </p>
            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={click}
                    className="flex-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                    Get Desktop Pro — $9
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
