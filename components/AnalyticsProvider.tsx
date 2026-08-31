'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
    ensureClientInfo,
    ensureSession,
    trackPageView,
    trackFunnelStep,
} from '@/lib/analytics';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        ensureClientInfo();
        ensureSession();
    }, []);

    useEffect(() => {
        if (!pathname || lastTrackedPath.current === pathname) return;
        lastTrackedPath.current = pathname;

        trackPageView(pathname);
        trackFunnelStep('page_visit', { path: pathname });
        trackConversionEvent('page_view', { path: pathname });
    }, [pathname]);

    return <>{children}</>;
}
