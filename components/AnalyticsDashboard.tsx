'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    getClientInfo,
    isRepeatVisitor,
    getPageViews,
    getTopPages,
    getFunnelBreakdown,
    getConversionRate,
    downloadAnalyticsData,
} from '@/lib/analytics';
import type { AnalyticsSnapshot } from '@/lib/analytics';
import { Users, FileJson, Repeat, Activity, Download, TrendingUp } from 'lucide-react';

export function AnalyticsDashboard() {
    const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);

    const buildSnapshot = useCallback(() => {
        const clientInfo = getClientInfo();
        const funnelBreakdown = getFunnelBreakdown();
        const totalFunnelEvents = Object.values(funnelBreakdown).reduce((a, b) => a + b, 0);
        const topPages = getTopPages();

        setSnapshot({
            clientInfo: clientInfo ?? {
                clientId: '—',
                firstVisit: 0,
                lastVisit: 0,
                visitCount: 0,
                sessionCount: 0,
            },
            session: { sessionId: '', startTime: 0, lastActivity: 0, pageViews: 0 },
            totalPageViews: getPageViews().length,
            totalFunnelEvents,
            topPages,
            funnelBreakdown,
            repeatVisitorRatio: clientInfo ? (clientInfo.visitCount - 1) / Math.max(clientInfo.visitCount, 1) : 0,
            conversionRate: getConversionRate(),
        });
    }, []);

    useEffect(() => {
        buildSnapshot();
    }, [buildSnapshot]);

    if (!snapshot) return null;

    const ci = snapshot.clientInfo;

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Client-side analytics from localStorage. No server involved.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadAnalyticsData('csv')}>
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadAnalyticsData('json')}>
                        <Download className="h-4 w-4 mr-2" /> Export JSON
                    </Button>
                </div>
            </div>

            {/* Lifetime Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">Visits</span>
                    </div>
                    <div className="text-3xl font-bold">{ci.visitCount}</div>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">Sessions</span>
                    </div>
                    <div className="text-3xl font-bold">{ci.sessionCount}</div>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Repeat className="h-5 w-5 text-purple-500" />
                        <span className="text-sm font-medium text-muted-foreground">Repeat Visits</span>
                    </div>
                    <div className="text-3xl font-bold">{Math.max(0, ci.visitCount - 1)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {Math.round(snapshot.repeatVisitorRatio * 100)}% of all visits
                    </div>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <FileJson className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium text-muted-foreground">Page Views</span>
                    </div>
                    <div className="text-3xl font-bold">{snapshot.totalPageViews}</div>
                </Card>
            </div>

            {/* Conversion Funnel */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-semibold">Conversion Funnel</h2>
                </div>
                <div className="space-y-4">
                    {(['page_visit', 'parse_initiated', 'parse_success', 'export_initiated', 'export_complete'] as const).map((step, idx) => {
                        const count = snapshot.funnelBreakdown[step] ?? 0;
                        const maxCount = snapshot.funnelBreakdown.page_visit ?? 1;
                        const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                        return (
                            <div key={step}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium capitalize">{step.replace(/_/g, ' ')}</span>
                                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    <div className="pt-3 text-sm text-muted-foreground border-t border-border mt-4">
                        Overall conversion rate:{' '}
                        <span className="font-semibold text-foreground">
                            {Math.round(snapshot.conversionRate * 100)}%
                        </span>
                    </div>
                </div>
            </Card>

            {/* Top Pages */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Top Pages</h2>
                {snapshot.topPages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No page views recorded yet.</p>
                ) : (
                    <div className="space-y-2">
                        {snapshot.topPages.map((page, idx) => (
                            <div key={page.path} className="flex justify-between items-center text-sm py-1">
                                <span className="text-muted-foreground font-mono text-xs truncate">
                                    {page.path}
                                </span>
                                <span className="font-medium ml-4">{page.count} views</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Client Info */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-3">Client Info</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Client ID</span>
                    <span className="font-mono text-xs truncate">{ci.clientId}</span>
                    <span className="text-muted-foreground">First Visit</span>
                    <span>{new Date(ci.firstVisit).toLocaleDateString()}</span>
                    <span className="text-muted-foreground">Last Visit</span>
                    <span>{new Date(ci.lastVisit).toLocaleDateString()}</span>
                    <span className="text-muted-foreground">Is Repeat Visitor</span>
                    <span>{isRepeatVisitor() ? 'Yes' : 'No (first visit)'}</span>
                </div>
            </Card>
        </div>
    );
}
