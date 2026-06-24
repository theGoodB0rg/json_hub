'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
    ensureClientInfo,
    ensureSession,
    trackPageView,
    trackFunnelStep,
} from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        ensureClientInfo();
        ensureSession();
    }, []);

    useEffect(() => {
        if (!pathname) return;
        trackPageView(pathname);
        trackFunnelStep('page_visit', { path: pathname });
    }, [pathname]);

    return <>{children}</>;
}
