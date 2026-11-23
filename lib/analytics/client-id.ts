import type { ClientInfo } from './types';

const STORAGE_KEY = 'jsonexport:analytics:client';

/** A visitor id is replaced after ~13 months, the usual ceiling for an
 *  audience-measurement identifier. */
const VISITOR_ID_MAX_AGE_MS = 395 * 24 * 60 * 60 * 1000;

function isBrowser() {
    return typeof window !== 'undefined';
}

function generateUUID(): string {
    try {
        return crypto.randomUUID();
    } catch {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
}

function write(info: ClientInfo) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } catch { /* noop */ }
}

function freshClientInfo(): ClientInfo {
    const now = Date.now();
    const fresh: ClientInfo = { clientId: generateUUID(), firstVisit: now, lastVisit: now, visitCount: 1, sessionCount: 0 };
    write(fresh);
    return fresh;
}

export function getClientInfo(): ClientInfo | null {
    if (!isBrowser()) return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ClientInfo) : null;
    } catch {
        return null;
    }
}

export function ensureClientInfo(): ClientInfo {
    const existing = getClientInfo();
    if (!existing) return freshClientInfo();
    const updated: ClientInfo = { ...existing, lastVisit: Date.now(), visitCount: existing.visitCount + 1 };
    write(updated);
    return updated;
}

export function incrementSessionCount() {
    const info = getClientInfo();
    if (!info) return;
    write({ ...info, sessionCount: info.sessionCount + 1 });
}

export function isRepeatVisitor(): boolean {
    const info = getClientInfo();
    return info !== null;
}

/** True when the browser asks not to be tracked (Global Privacy Control or
 *  Do Not Track). Telemetry then carries no visitor or session id. */
export function hasOptedOut(): boolean {
    if (!isBrowser()) return true;
    try {
        const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
        return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
    } catch {
        return false;
    }
}

/**
 * The random per-browser id sent with telemetry, so one visitor's events can
 * be read as a journey instead of guessed from country + browser (Nov 2026: a
 * "single" 144-export visitor turned out to be at least 16 browsers).
 * Generated here, derived from nothing about the person, replaced after ~13
 * months, and null when the browser opts out.
 */
export function getVisitorId(): string | null {
    if (hasOptedOut()) return null;
    const info = getClientInfo();
    if (!info || !info.firstVisit || Date.now() - info.firstVisit > VISITOR_ID_MAX_AGE_MS) {
        return freshClientInfo().clientId;
    }
    return info.clientId;
}
