import type { PageView } from './types';
import { ensureSession, incrementPageViewCount } from './session';

const STORAGE_KEY = 'jsonexport:analytics:page-views';
const MAX_PAGE_VIEWS = 100;

function isBrowser() {
    return typeof window !== 'undefined';
}

function loadViews(): PageView[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as PageView[]) : [];
    } catch {
        return [];
    }
}

function saveViews(views: PageView[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(views.slice(-MAX_PAGE_VIEWS)));
    } catch { /* noop */ }
}

export function trackPageView(path: string) {
    if (!isBrowser()) return;
    const session = ensureSession();
    incrementPageViewCount();

    const view: PageView = {
        path,
        referrer: document.referrer || '(direct)',
        timestamp: Date.now(),
        sessionId: session.sessionId,
    };

    const existing = loadViews();
    saveViews([...existing, view]);
}

export function getPageViews(): PageView[] {
    return loadViews();
}

export function getTopPages(limit = 10): Array<{ path: string; count: number }> {
    const views = loadViews();
    const counts = new Map<string, number>();
    for (const v of views) {
        counts.set(v.path, (counts.get(v.path) ?? 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([path, count]) => ({ path, count }));
}
