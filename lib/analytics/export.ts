import { getClientInfo } from './client-id';
import { getSession } from './session';
import { getPageViews, getTopPages } from './page-view';
import { getFunnelEvents, getFunnelBreakdown, getConversionRate } from './event-funnel';
import { getTrackedConversionEvents } from '@/lib/telemetry/conversion-events';

export interface FullAnalyticsExport {
    exportedAt: number;
    clientInfo: ReturnType<typeof getClientInfo>;
    session: ReturnType<typeof getSession>;
    pageViews: ReturnType<typeof getPageViews>;
    funnelEvents: ReturnType<typeof getFunnelEvents>;
    conversionEvents: ReturnType<typeof getTrackedConversionEvents>;
    topPages: ReturnType<typeof getTopPages>;
    funnelBreakdown: ReturnType<typeof getFunnelBreakdown>;
    conversionRate: number;
}

export function collectAnalyticsExport(): FullAnalyticsExport {
    return {
        exportedAt: Date.now(),
        clientInfo: getClientInfo(),
        session: getSession(),
        pageViews: getPageViews(),
        funnelEvents: getFunnelEvents(),
        conversionEvents: getTrackedConversionEvents(),
        topPages: getTopPages(),
        funnelBreakdown: getFunnelBreakdown(),
        conversionRate: getConversionRate(),
    };
}

function toCsvRow(values: (string | number | boolean | null | undefined)[]): string {
    return values
        .map(v => {
            if (v === null || v === undefined) return '';
            const str = String(v);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        })
        .join(',');
}

export function exportAnalyticsCsv(): string {
    const data = collectAnalyticsExport();
    const lines: string[] = [];

    lines.push('# JsonExport Analytics Export');
    lines.push(`# Exported: ${new Date(data.exportedAt).toISOString()}`);
    lines.push(`# Client ID: ${data.clientInfo?.clientId ?? 'unknown'}`);
    lines.push(`# Visits: ${data.clientInfo?.visitCount ?? 0}`);
    lines.push(`# Sessions: ${data.clientInfo?.sessionCount ?? 0}`);
    lines.push('');

    lines.push('# Funnel Breakdown');
    lines.push('step,count');
    const steps = ['page_visit', 'parse_initiated', 'parse_success', 'export_initiated', 'export_complete'] as const;
    for (const step of steps) {
        lines.push(toCsvRow([step, data.funnelBreakdown[step] ?? 0]));
    }
    lines.push(toCsvRow(['conversion_rate', data.conversionRate]));
    lines.push('');

    lines.push('# Top Pages');
    lines.push('path,views');
    for (const page of data.topPages) {
        lines.push(toCsvRow([page.path, page.count]));
    }
    lines.push('');

    lines.push('# Page Views');
    lines.push('path,referrer,timestamp,sessionId');
    for (const v of data.pageViews) {
        lines.push(toCsvRow([v.path, v.referrer, new Date(v.timestamp).toISOString(), v.sessionId]));
    }
    lines.push('');

    lines.push('# Funnel Events');
    lines.push('step,timestamp,page,duration');
    for (const e of data.funnelEvents) {
        lines.push(toCsvRow([e.step, new Date(e.timestamp).toISOString(), e.page, e.duration ?? '']));
    }
    lines.push('');

    lines.push('# Conversion Events');
    lines.push('name,timestamp');
    for (const e of data.conversionEvents) {
        lines.push(toCsvRow([e.name, new Date(e.timestamp).toISOString()]));
    }

    return lines.join('\n');
}

export function exportAnalyticsJson(): string {
    return JSON.stringify(collectAnalyticsExport(), null, 2);
}

export function downloadAnalyticsData(format: 'csv' | 'json' = 'csv') {
    const content = format === 'csv' ? exportAnalyticsCsv() : exportAnalyticsJson();
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jsonexport-analytics-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
