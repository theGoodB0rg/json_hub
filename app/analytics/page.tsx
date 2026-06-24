import type { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

export const metadata: Metadata = {
    title: 'Analytics | JsonExport',
    robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
    return <AnalyticsDashboard />;
}
