export type ConversionEventName =
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
    name: ConversionEventName;
    timestamp: number;
    payload: ConversionEventPayload;
}

export interface UserFeedbackPayload {
    rating: 'positive' | 'negative';
    comment?: string;
    platform?: string;
    format?: string;
    path?: string;
}

const STORAGE_KEY = 'jsonexport:conversion-events';
const FEEDBACK_STORAGE_KEY = 'jsonexport:user-feedback';
const MAX_EVENTS = 200;

function isBrowser() {
    return typeof window !== 'undefined';
}

function getTelemetryEndpoint(subpath: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_TELEMETRY_URL || '';
    if (baseUrl) {
        return `${baseUrl.replace(/\/$/, '')}${subpath}`;
    }
    return subpath;
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
            // Fails silently to protect user experience
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
        name,
        timestamp: Date.now(),
        payload: {
            ...payload,
            path: typeof window !== 'undefined' ? window.location.pathname : undefined,
            referrer: typeof document !== 'undefined' ? document.referrer || '(direct)' : undefined,
        },
    };

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
    sendRemotePayload(endpoint, {
        event_name: name,
        ...event.payload,
    });
}

export async function sendUserFeedback(feedback: UserFeedbackPayload): Promise<void> {
    if (!isBrowser()) return;

    const record = {
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
        window.localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    } catch {
        // Ignore localStorage errors.
    }
}
