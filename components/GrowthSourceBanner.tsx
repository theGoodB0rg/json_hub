'use client';

import { useEffect, useState, useRef } from 'react';
import { Rocket, Star } from 'lucide-react';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

type SourceConfig = {
    label: string;
    headline: string;
    body: string;
};

const SOURCE_COPY: Record<string, SourceConfig> = {
    producthunt: {
        label: 'Product Hunt',
        headline: 'Welcome, Product Hunt community',
        body: 'Try your toughest JSON export. Everything runs locally in your browser.',
    },
    g2: {
        label: 'G2',
        headline: 'Welcome, G2 visitors',
        body: 'Test a real file and see how quickly nested JSON becomes spreadsheet-ready.',
    },
    capterra: {
        label: 'Capterra',
        headline: 'Welcome, Capterra visitors',
        body: 'No upload, no signup. Convert sensitive JSON safely in-browser.',
    },
    reddit: {
        label: 'Reddit',
        headline: 'Welcome from Reddit',
        body: 'Paste any messy payload and export clean rows in seconds.',
    },
    stackoverflow: {
        label: 'Stack Overflow',
        headline: 'Welcome from Stack Overflow',
        body: 'Use this to validate and flatten API responses without writing glue scripts.',
    },
    quora: {
        label: 'Quora',
        headline: 'Welcome from Quora',
        body: 'Fastest way to turn nested JSON into Excel-ready tables.',
    },
    linkedin: {
        label: 'LinkedIn',
        headline: 'Welcome from LinkedIn',
        body: 'Private JSON conversion for ops and analytics workflows.',
    },
    twitter: {
        label: 'X',
        headline: 'Welcome from X',
        body: 'Upload JSON, review instantly, and export without sending data to servers.',
    },
};

function normalizeSource(raw: string | null): string | null {
    if (!raw) return null;
    const source = raw.trim().toLowerCase();
    if (!source) return null;
    if (source === 'x') return 'twitter';
    return source;
}

export function GrowthSourceBanner() {
    const trackedSourceRef = useRef<string | null>(null);
    const [source, setSource] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setSource(normalizeSource(params.get('utm_source')));
    }, []);

    const sourceConfig = source ? SOURCE_COPY[source] ?? null : null;

    useEffect(() => {
        if (!sourceConfig || !source) return;
        if (trackedSourceRef.current === source) return;

        trackConversionEvent('campaign_source_detected', {
            source,
            placement: 'hero-banner',
        });
        trackedSourceRef.current = source;
    }, [sourceConfig, source]);

    if (!sourceConfig) return null;

    return (
        <div
            className="container mx-auto px-4 mt-6"
            data-testid="growth-source-banner"
        >
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                            <Rocket className="h-3.5 w-3.5" />
                            {sourceConfig.label} Traffic
                        </div>
                        <p className="text-sm md:text-base font-semibold">{sourceConfig.headline}</p>
                        <p className="text-sm text-muted-foreground">{sourceConfig.body}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                        <Star className="h-3.5 w-3.5" />
                        Free forever
                    </div>
                </div>
            </div>
        </div>
    );
}
