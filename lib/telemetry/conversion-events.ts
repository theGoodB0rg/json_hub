import { dispatch, flushQueue } from './dispatcher';
import {
    resolveEndpoints,
    ingestFallbackChain,
    feedbackFallbackChain,
} from './endpoints';
import { resolveSampleFlag } from './sample-detection';

export type ConversionEventName =
    | 'page_view'
    | 'funnel_step'
    | 'parse_start'
    | 'parse_success'
    | 'sample_preview'
    | 'parse_error'
    | 'export_success'
    | 'export_error'
    | 'feedback_submitted'
    | 'growth_badge_click'
    | 'campaign_source_detected'
    | 'affiliate_toast_shown'
    | 'affiliate_toast_click'
    | 'affiliate_sidebar_click'
    | 'github_star_click'
    | 'github_issues_click'
    // Post-export Pro upsell (M1 in MONETIZATION_ROADMAP_2026-10-10.md)
    | 'upsell_shown'
    | 'upsell_dismissed'
    | 'upsell_clicked'
    // Any click on a Gumroad "buy Pro" link. Source rides in `format`.
    | 'checkout_clicked';

export interface ConversionEventPayload {
    [key: string]: string | number | boolean | null | undefined;
}

export interface ConversionEvent {
    id: string;
    name: ConversionEventName;
    timestamp: number;
    payload: ConversionEventPayload;
}

export interface UserFeedbackPayload {
    id?: string;
    rating: 'positive' | 'negative' | 'neutral';
    comment?: string;
    platform?: string;
    format?: string;
    path?: string;
    /** True when the rating is about a demo/sample conversion rather than a
     *  file the user supplied. Sent to D1 as `is_sample` so the analytics
     *  report can exclude it from the satisfaction rate — our own demo and
     *  E2E submissions previously read as genuine user dissatisfaction. */
    isSample?: boolean;
}

const STORAGE_KEY = 'jsonexport:conversion-events';
const FEEDBACK_STORAGE_KEY = 'jsonexport:user-feedback';
const MAX_EVENTS = 200;

// Shared TextEncoder — serializing JSON payloads to UTF-8 bytes for the
// transport layer. Reused to avoid per-call allocation.
const JSON_ENCODER = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const JSON_CONTENT_TYPE = 'application/json';

function encodeJson(obj: unknown): Uint8Array {
    const text = JSON.stringify(obj);
    if (JSON_ENCODER) return JSON_ENCODER.encode(text);
    // Fallback for very old environments — convert via unescape(encodeURIComponent(…)).
    const bin = unescape(encodeURIComponent(text));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function isBrowser() {
    return typeof window !== 'undefined';
}

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch {
            // fallback
        }
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getTelemetryEndpoint(subpath: string): string {
    // Backward-compat shim. New code resolves via endpoints.ts directly.
    // Returns '' when unconfigured — callers must treat empty as disabled.
    // (The old hardcoded production default was removed Oct 2026: it made
    // every clone phone production telemetry. See endpoints.ts.)
    const baseUrl = (process.env.NEXT_PUBLIC_TELEMETRY_URL || '').replace(/\/$/, '');
    return baseUrl ? `${baseUrl}${subpath}` : '';
}

/**
 * Public: drain the IndexedDB-backed outbound queue. Called on `online`
 * events, on page-visibility changes, and opportunistically after each
 * successful dispatch. Safe to call concurrently — the dispatcher's own
 * lock prevents reentry.
 */
export async function flushPendingTelemetry() {
    if (!isBrowser()) return;
    try {
        await flushQueue();
    } catch {
        // Fails gracefully — will retry on next trigger.
    }
}

// Auto-flush on reconnection and tab-visibility events — the two moments
// when queued events are most likely to actually deliver.
if (isBrowser()) {
    try {
        window.addEventListener('online', () => { flushPendingTelemetry().catch(() => {}); });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                flushPendingTelemetry().catch(() => {});
            }
        });
    } catch {
        // Ignore listener error
    }
}

export const BOT_USER_AGENT_REGEX =
    /bot|crawler|spider|crawling|headless|meta-externalagent|facebookexternalhit|bingbot|googlebot|yandex|baidu|slurp|duckduckbot/i;

export function isBotOrCrawler(): boolean {
    if (!isBrowser()) return false;
    try {
        if (navigator.webdriver) return true;
        if (typeof navigator.userAgent === 'string' && BOT_USER_AGENT_REGEX.test(navigator.userAgent)) return true;
    } catch {
        // ignore
    }
    return false;
}

export function trackConversionEvent(
    name: ConversionEventName,
    payload: ConversionEventPayload = {}
) {
    if (!isBrowser() || isBotOrCrawler()) return;

    const event: ConversionEvent = {
        id: generateId(),
        name,
        timestamp: Date.now(),
        payload: {
            path: typeof window !== 'undefined' ? window.location.pathname : undefined,
            referrer: typeof document !== 'undefined' ? document.referrer || '(direct)' : undefined,
            ...payload,
        },
    };

    // Store in local history for diagnostics
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const existing: ConversionEvent[] = raw ? JSON.parse(raw) : [];
        const updated = [...existing, event].slice(-MAX_EVENTS);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // Local storage full or private browsing
    }

    try {
        window.dispatchEvent(new CustomEvent('jsonexport:conversion-event', { detail: event }));
    } catch {
        // Ignore dispatch errors
    }

    // Transmit via first-party → legacy fallback chain + transport chain.
    // Dispatcher handles its own queueing when every endpoint+transport fails.
    // Fail-closed: with no endpoint configured (dev/clone without env) we
    // keep local diagnostics + the DOM event but send nothing anywhere.
    const endpoints = ingestFallbackChain(resolveEndpoints());
    if (endpoints.length === 0) return;

    const flatEvent = {
        id: event.id,
        event_name: name,
        timestamp: event.timestamp,
        ...event.payload,
    };

    const body = encodeJson(flatEvent);
    void dispatch({ endpoints, body, contentType: JSON_CONTENT_TYPE });

    // Opportunistic drain in case prior events are stuck in the queue.
    setTimeout(() => { flushPendingTelemetry().catch(() => {}); }, 500);
}

export async function sendUserFeedback(feedback: UserFeedbackPayload): Promise<void> {
    if (!isBrowser()) return;

    const { isSample, ...rest } = feedback;
    // Quarantine, don't trust: the store flag covers demo conversions, but
    // automated harnesses (jsdom QA probes, Playwright E2E) never set it and
    // their ratings previously counted as genuine user dissatisfaction.
    // resolveSampleFlag ORs the store flag with environment detection, so a
    // harness that forgets the flag is still labelled is_sample = 1. The
    // worker re-checks the request UA server-side as a second layer.
    const flag = resolveSampleFlag({ storeIsSample: isSample });
    const effectiveSample = flag.isSample;
    const record = {
        ...rest,
        id: feedback.id || generateId(),
        path: feedback.path || (typeof window !== 'undefined' ? window.location.pathname : ''),
        timestamp: Date.now(),
        // snake_case on the wire — the D1 column is `is_sample`.
        is_sample: effectiveSample ? 1 : 0,
    };

    try {
        const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        const updated = [...existing, record].slice(-MAX_EVENTS);
        window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // Ignore local storage error
    }

    trackConversionEvent('feedback_submitted', {
        rating: feedback.rating,
        platform: feedback.platform,
        has_comment: !!feedback.comment,
        is_sample: effectiveSample ? 1 : 0,
    });

    // Route feedback through the same first-party → legacy chain so it
    // benefits from the full blocker-resistance stack. Fail-closed like
    // trackConversionEvent: local record + mirror event are kept, but with
    // no endpoint configured nothing leaves the machine.
    const endpoints = feedbackFallbackChain(resolveEndpoints());
    if (endpoints.length === 0) return;
    const body = encodeJson(record);
    await dispatch({ endpoints, body, contentType: JSON_CONTENT_TYPE });
}

export function getTrackedConversionEvents(): ConversionEvent[] {
    if (!isBrowser()) return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function clearTrackedConversionEvents() {
    if (!isBrowser()) return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(FEEDBACK_STORAGE_KEY);
        // Legacy pending queue key — removed from the active code path but
        // still cleared here so machines upgrading from the old client don't
        // keep stale entries forever.
        window.localStorage.removeItem('jsonexport:telemetry-pending');
    } catch {
        // Ignore localStorage errors.
    }
}
