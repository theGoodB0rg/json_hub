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
import { PostExportUpsell } from './PostExportUpsell';
import { verifyCachedLicense } from '@/lib/license/activation';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        ensureClientInfo();
        ensureSession();
        // Re-verify any cached license on boot so returning Pro users don't
        // see "Free" state flash on page load, and refunded buyers lose
        // access automatically within one session.
        void verifyCachedLicense();
    }, []);

    useEffect(() => {
        if (!pathname || lastTrackedPath.current === pathname) return;
        lastTrackedPath.current = pathname;

        trackPageView(pathname);
        trackFunnelStep('page_visit', { path: pathname });
        trackConversionEvent('page_view', { path: pathname });
    }, [pathname]);

    return (
        <>
            {children}
            {/*
              Mounted globally so any surface that fires `export_success` via
              `trackConversionEvent` triggers the toast. The component gates
              itself on isPro, sample status, and a 24h cooldown.
            */}
            <PostExportUpsell />
        </>
    );
}
