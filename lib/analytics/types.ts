export interface ClientInfo {
    clientId: string;
    firstVisit: number;
    lastVisit: number;
    visitCount: number;
    sessionCount: number;
}

export interface SessionInfo {
    sessionId: string;
    startTime: number;
    lastActivity: number;
    pageViews: number;
}

export type FunnelStep =
    | 'page_visit'
    | 'parse_initiated'
    | 'parse_success'
    | 'export_initiated'
    | 'export_complete';

export interface FunnelEvent {
    step: FunnelStep;
    timestamp: number;
    page: string;
    duration?: number;
    payload?: Record<string, string | number | boolean | null | undefined>;
}

export interface PageView {
    path: string;
    referrer: string;
    timestamp: number;
    sessionId: string;
    duration?: number;
}

export interface AnalyticsSnapshot {
    clientInfo: ClientInfo;
    session: SessionInfo;
    totalPageViews: number;
    totalFunnelEvents: number;
    topPages: Array<{ path: string; count: number }>;
    funnelBreakdown: Record<FunnelStep, number>;
    repeatVisitorRatio: number;
    conversionRate: number;
}
