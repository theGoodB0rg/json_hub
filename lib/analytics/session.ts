import type { SessionInfo } from './types';
import { incrementSessionCount } from './client-id';

const STORAGE_KEY = 'jsonexport:analytics:session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function isBrowser() {
    return typeof window !== 'undefined';
}

function generateSessionId(): string {
    return `${Date.now()}-${crypto.randomUUID?.()?.slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`;
}

function loadRaw(): SessionInfo | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as SessionInfo) : null;
    } catch {
        return null;
    }
}

function save(session: SessionInfo) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch { /* noop */ }
}

export function getSession(): SessionInfo | null {
    return loadRaw();
}

function isSessionExpired(session: SessionInfo): boolean {
    return Date.now() - session.lastActivity > SESSION_TIMEOUT_MS;
}

export function ensureSession(): SessionInfo {
    const existing = loadRaw();

    if (existing && !isSessionExpired(existing)) {
        const updated: SessionInfo = {
            ...existing,
            lastActivity: Date.now(),
        };
        save(updated);
        return updated;
    }

    incrementSessionCount();

    const fresh: SessionInfo = {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        lastActivity: Date.now(),
        pageViews: 0,
    };
    save(fresh);
    return fresh;
}

export function touchSession() {
    const session = loadRaw();
    if (!session) return;
    session.lastActivity = Date.now();
    save(session);
}

export function incrementPageViewCount() {
    const session = loadRaw();
    if (!session) return;
    session.pageViews += 1;
    session.lastActivity = Date.now();
    save(session);
}
