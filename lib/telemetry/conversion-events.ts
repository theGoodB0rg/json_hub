export type ConversionEventName =
    | 'parse_success'
    | 'parse_error'
    | 'export_success'
    | 'export_error'
    | 'growth_badge_click'
    | 'campaign_source_detected'
    | 'affiliate_toast_shown'
    | 'affiliate_toast_click';

export interface ConversionEventPayload {
    [key: string]: string | number | boolean | null | undefined;
}

export interface ConversionEvent {
    name: ConversionEventName;
    timestamp: number;
    payload: ConversionEventPayload;
}

const STORAGE_KEY = 'jsonexport:conversion-events';
const MAX_EVENTS = 200;

function isBrowser() {
    return typeof window !== 'undefined';
}

export function trackConversionEvent(
    name: ConversionEventName,
    payload: ConversionEventPayload = {}
) {
    if (!isBrowser()) return;

    const event: ConversionEvent = {
        name,
        timestamp: Date.now(),
        payload,
    };

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const existing: ConversionEvent[] = raw ? JSON.parse(raw) : [];
        const updated = [...existing, event].slice(-MAX_EVENTS);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // Telemetry must never block conversion flow.
    }

    try {
        window.dispatchEvent(new CustomEvent('jsonexport:conversion-event', { detail: event }));
    } catch {
        // Ignore dispatch errors in non-standard runtimes.
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
    } catch {
        // Ignore localStorage errors.
    }
}
