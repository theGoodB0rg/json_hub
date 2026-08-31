export type ConversionEventName =
    | 'page_view'
    | 'funnel_step'
    | 'parse_start'
    | 'parse_success'
    | 'parse_error'
    | 'export_success'
    | 'export_error'
    | 'feedback_submitted'
    | 'growth_badge_click'
    | 'campaign_source_detected'
    | 'affiliate_toast_shown'
    | 'affiliate_toast_click'
    | 'github_star_click'
    | 'github_issues_click';

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
}

export const DEFAULT_TELEMETRY_URL = 'https://jsonexport-telemetry.idowue93.workers.dev';
const STORAGE_KEY = 'jsonexport:conversion-events';
const PENDING_QUEUE_KEY = 'jsonexport:telemetry-pending';
const FEEDBACK_STORAGE_KEY = 'jsonexport:user-feedback';
const MAX_EVENTS = 200;
const MAX_PENDING = 100;

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
    const baseUrl = process.env.NEXT_PUBLIC_TELEMETRY_URL || DEFAULT_TELEMETRY_URL;
    return `${baseUrl.replace(/\/$/, '')}${subpath}`;
}

function getPendingQueue(): any[] {
    if (!isBrowser()) return [];
    try {
        const raw = window.localStorage.getItem(PENDING_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function savePendingQueue(queue: any[]) {
    if (!isBrowser()) return;
    try {
        window.localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue.slice(-MAX_PENDING)));
    } catch {
        // Local storage error
    }
}

let isFlushing = false;
export async function flushPendingTelemetry() {
    if (!isBrowser() || isFlushing) return;
    const queue = getPendingQueue();
    if (queue.length === 0) return;

    isFlushing = true;
    const batch = queue.slice(0, 50);
    const endpoint = getTelemetryEndpoint('/api/telemetry/batch');

    try {
        const body = JSON.stringify({ events: batch });
        let sent = false;

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            const blob = new Blob([body], { type: 'application/json' });
            sent = navigator.sendBeacon(endpoint, blob);
        }

        if (!sent) {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
            });
            sent = res.ok;
        }

        if (sent) {
            const remaining = queue.slice(batch.length);
            savePendingQueue(remaining);
        }
    } catch {
        // Will retry on next activity or online event
    } finally {
        isFlushing = false;
    }
}

// Auto-flush on window online event
if (isBrowser()) {
    try {
        window.addEventListener('online', () => {
            flushPendingTelemetry().catch(() => {});
        });
    } catch {
        // Ignore listener error
    }
}

function sendRemotePayload(url: string, data: any) {
    if (!isBrowser()) return;

    try {
        const body = JSON.stringify(data);
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            const blob = new Blob([body], { type: 'application/json' });
            const sent = navigator.sendBeacon(url, blob);
            if (sent) return;
        }

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
        }).catch(() => {
            // Fails silently, already queued in pending storage if critical
        });
    } catch {
        // Suppress telemetry errors
    }
}

export function trackConversionEvent(
    name: ConversionEventName,
    payload: ConversionEventPayload = {}
) {
    if (!isBrowser()) return;

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

    // Transmit to Cloudflare D1 worker
    const endpoint = getTelemetryEndpoint('/api/telemetry');
    const flatEvent = {
        id: event.id,
        event_name: name,
        timestamp: event.timestamp,
        ...event.payload,
    };

    // Add to pending queue and attempt transmission
    const pending = getPendingQueue();
    savePendingQueue([...pending, flatEvent]);

    sendRemotePayload(endpoint, flatEvent);

    // If there's an accumulated queue, flush in background
    if (pending.length > 0) {
        setTimeout(() => {
            flushPendingTelemetry().catch(() => {});
        }, 100);
    }
}

export async function sendUserFeedback(feedback: UserFeedbackPayload): Promise<void> {
    if (!isBrowser()) return;

    const record = {
        id: feedback.id || generateId(),
        ...feedback,
        path: feedback.path || (typeof window !== 'undefined' ? window.location.pathname : ''),
        timestamp: Date.now(),
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
    });

    const endpoint = getTelemetryEndpoint('/api/feedback');
    try {
        await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
            keepalive: true,
        });
    } catch {
        // Fails gracefully
    }
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
        window.localStorage.removeItem(PENDING_QUEUE_KEY);
        window.localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    } catch {
        // Ignore localStorage errors.
    }
}
