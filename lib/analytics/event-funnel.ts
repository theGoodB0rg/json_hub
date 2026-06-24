import type { FunnelStep, FunnelEvent } from './types';

const STORAGE_KEY = 'jsonexport:analytics:funnel';
const MAX_EVENTS = 200;

function isBrowser() {
    return typeof window !== 'undefined';
}

function loadEvents(): FunnelEvent[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as FunnelEvent[]) : [];
    } catch {
        return [];
    }
}

function saveEvents(events: FunnelEvent[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch { /* noop */ }
}

export function trackFunnelStep(
    step: FunnelStep,
    payload?: Record<string, string | number | boolean | null | undefined>,
) {
    if (!isBrowser()) return;

    const previous = loadEvents();
    const lastSameStep = [...previous].reverse().find(e => e.step === step);

    const event: FunnelEvent = {
        step,
        timestamp: Date.now(),
        page: window.location.pathname,
        duration: lastSameStep ? Date.now() - lastSameStep.timestamp : undefined,
        payload,
    };

    saveEvents([...previous, event]);
}

export function getFunnelEvents(): FunnelEvent[] {
    return loadEvents();
}

export function getFunnelBreakdown(): Record<FunnelStep, number> {
    const events = loadEvents();
    const steps: FunnelStep[] = [
        'page_visit',
        'parse_initiated',
        'parse_success',
        'export_initiated',
        'export_complete',
    ];
    const breakdown = {} as Record<FunnelStep, number>;
    for (const step of steps) {
        breakdown[step] = 0;
    }
    for (const e of events) {
        breakdown[e.step] = (breakdown[e.step] ?? 0) + 1;
    }
    return breakdown;
}

export function getConversionRate(): number {
    const breakdown = getFunnelBreakdown();
    const visits = breakdown.page_visit;
    if (visits === 0) return 0;
    const exports = breakdown.export_complete;
    return exports / visits;
}
