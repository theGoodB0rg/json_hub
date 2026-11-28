/**
 * Unique and returning visitors on the website, counted from the random
 * per-browser `visitor_id` (see lib/analytics/client-id.ts). Ids only exist
 * from 2026-11-23 on, and browsers that send GPC/DNT (or still run a cached
 * pre-id bundle) send none, so every figure here is a floor: the report shows
 * id coverage next to it.
 *
 * "Returning" means seen on two or more different UTC days. A second 30-min
 * session on the same day is reported separately: it is someone coming back
 * from a break, not a bookmark.
 *
 * Bookmarks, typed URLs and links shared in chat/email all arrive with no
 * referrer, so "direct" mixes them with privacy browsers. The returning count
 * is the cleaner loyalty signal.
 */
import { isAutomatedUserAgent } from '../telemetry/sample-detection';

export const VISITOR_ID_EPOCH = Date.parse('2026-11-23T00:00:00Z');

const DAY_MS = 24 * 60 * 60 * 1000;
const USE_EVENTS = new Set(['parse_success', 'export_success', 'export_complete']);
/** Client events that would carry an id when one exists (edge fallback rows never do). */
const ID_CAPABLE_EVENTS = new Set(['page_view', 'parse_success', 'export_success', 'ui_interaction']);

export interface VisitorEvent {
    event_name: string;
    timestamp: number;
    visitor_id?: string | null;
    session_id?: string | null;
    referrer?: string | null;
    user_agent?: string | null;
}

export type FirstSource = 'google' | 'bing' | 'other search' | 'ai assistant' | 'direct' | 'other site';

export interface VisitorWindow {
    label: string;
    start: number;
    end: number;
    /** True when the window starts before ids existed, so the counts cover only part of it. */
    partial: boolean;
    uniqueVisitors: number;
    /** Loaded data or exported at least once. */
    activeVisitors: number;
    /** Seen on 2+ different UTC days. */
    returningVisitors: number;
    /** 2+ sessions but all on one day. */
    sameDayRepeatVisitors: number;
    firstSource: Record<FirstSource, number>;
    /** Share of id-capable client events (on or after VISITOR_ID_EPOCH) that carried an id. */
    idCoverage: number | null;
}

export interface VisitorSummary {
    generatedAt: number;
    windows: VisitorWindow[];
}

const AI_HOSTS = /(^|\.)(chatgpt\.com|chat\.openai\.com|gemini\.google\.com|perplexity\.ai|claude\.ai|copilot\.microsoft\.com|you\.com|phind\.com|deepseek\.com)$/;
const SEARCH_HOSTS = /(^|\.)(duckduckgo\.com|yandex\.[a-z.]+|baidu\.com|yahoo\.com|ecosia\.org|naver\.com|brave\.com|startpage\.com|qwant\.com|sogou\.com)$/;

export function classifySource(referrer?: string | null): FirstSource {
    if (!referrer || referrer === '(direct)') return 'direct';
    let host: string;
    try {
        host = new URL(referrer).hostname.toLowerCase();
    } catch {
        return 'direct';
    }
    if (AI_HOSTS.test(host)) return 'ai assistant';
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google';
    if (/(^|\.)bing\.com$/.test(host)) return 'bing';
    if (SEARCH_HOSTS.test(host)) return 'other search';
    if (host === 'jsonexport.com' || host.endsWith('.jsonexport.com')) return 'direct';
    return 'other site';
}

const utcDay = (t: number) => new Date(t).toISOString().slice(0, 10);

function emptySources(): Record<FirstSource, number> {
    return { google: 0, bing: 0, 'other search': 0, 'ai assistant': 0, direct: 0, 'other site': 0 };
}

/** Website events from real browsers only: no desktop app, no test harness. */
function isWebHuman(e: VisitorEvent): boolean {
    return !e.referrer?.startsWith('app:') && !isAutomatedUserAgent(e.user_agent);
}

export function computeVisitorWindow(events: VisitorEvent[], label: string, start: number, end: number): VisitorWindow {
    const inWindow = events.filter(e => e.timestamp >= start && e.timestamp < end && isWebHuman(e));
    const byVisitor = new Map<string, VisitorEvent[]>();
    for (const e of inWindow) {
        if (!e.visitor_id) continue;
        const list = byVisitor.get(e.visitor_id);
        if (list) list.push(e);
        else byVisitor.set(e.visitor_id, [e]);
    }

    let active = 0;
    let returning = 0;
    let sameDay = 0;
    const firstSource = emptySources();
    for (const list of byVisitor.values()) {
        list.sort((a, b) => a.timestamp - b.timestamp);
        if (list.some(e => USE_EVENTS.has(e.event_name))) active++;
        const days = new Set(list.map(e => utcDay(e.timestamp)));
        const sessions = new Set(list.map(e => e.session_id ?? 'none'));
        if (days.size > 1) returning++;
        else if (sessions.size > 1) sameDay++;
        // Source of the visit that brought them, not of later internal navigation.
        const firstSession = list.filter(e => e.session_id === list[0].session_id);
        firstSource[classifySource(firstSession.find(e => e.referrer)?.referrer)]++;
    }

    // Days before ids existed would drag coverage down for no reason.
    const capable = inWindow.filter(e => ID_CAPABLE_EVENTS.has(e.event_name) && e.timestamp >= VISITOR_ID_EPOCH);
    return {
        label,
        start,
        end,
        partial: start < VISITOR_ID_EPOCH,
        uniqueVisitors: byVisitor.size,
        activeVisitors: active,
        returningVisitors: returning,
        sameDayRepeatVisitors: sameDay,
        firstSource,
        idCoverage: capable.length ? capable.filter(e => e.visitor_id).length / capable.length : null,
    };
}

/** This month, last month (once ids cover it) and the last 7 days, all UTC. */
export function computeVisitors(events: VisitorEvent[], now = Date.now()): VisitorSummary {
    const d = new Date(now);
    const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    const prevMonthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1);
    const monthName = (t: number) => new Date(t).toISOString().slice(0, 7);

    const windows: VisitorWindow[] = [];
    if (monthStart > VISITOR_ID_EPOCH) {
        windows.push(computeVisitorWindow(events, `${monthName(prevMonthStart)} (full month)`, prevMonthStart, monthStart));
    }
    windows.push(computeVisitorWindow(events, `${monthName(monthStart)} (month to date)`, monthStart, now + 1));
    windows.push(computeVisitorWindow(events, 'Last 7 days', now - 7 * DAY_MS, now + 1));
    return { generatedAt: now, windows };
}

const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : '–');

export function formatVisitors(summary: VisitorSummary): string[] {
    const lines: string[] = [];
    for (const w of summary.windows) {
        const note = w.partial ? `  ⚠ ids only since ${utcDay(VISITOR_ID_EPOCH)}; earlier days uncounted` : '';
        lines.push(`${w.label}:${note}`);
        if (w.uniqueVisitors === 0) {
            lines.push('  no visitors with an id in this window');
            continue;
        }
        lines.push(
            `  unique ${w.uniqueVisitors} | used the tool ${w.activeVisitors} (${pct(w.activeVisitors, w.uniqueVisitors)})` +
            ` | returning (2+ days) ${w.returningVisitors} (${pct(w.returningVisitors, w.uniqueVisitors)})` +
            ` | same-day repeat ${w.sameDayRepeatVisitors}`
        );
        const src = Object.entries(w.firstSource).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
        lines.push(`  came from: ${src.map(([s, n]) => `${s} ${n}`).join(', ')}`);
        if (w.idCoverage !== null) {
            lines.push(`  id coverage ${pct(w.idCoverage, 1)} of client events, so these counts are a floor`);
        }
    }
    lines.push('"direct" = bookmarks, typed URLs, links shared in chat/email and referrer-stripping browsers; returning (2+ days) is the cleaner loyalty signal.');
    return lines;
}
