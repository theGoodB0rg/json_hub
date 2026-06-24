import type { ClientInfo } from './types';

const STORAGE_KEY = 'jsonexport:analytics:client';

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
    if (existing) {
        const updated: ClientInfo = {
            ...existing,
            lastVisit: Date.now(),
            visitCount: existing.visitCount + 1,
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch { /* noop */ }
        return updated;
    }

    const fresh: ClientInfo = {
        clientId: generateUUID(),
        firstVisit: Date.now(),
        lastVisit: Date.now(),
        visitCount: 1,
        sessionCount: 0,
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch { /* noop */ }
    return fresh;
}

export function incrementSessionCount() {
    const info = getClientInfo();
    if (!info) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...info,
            sessionCount: info.sessionCount + 1,
        }));
    } catch { /* noop */ }
}

export function isRepeatVisitor(): boolean {
    const info = getClientInfo();
    return info !== null;
}
