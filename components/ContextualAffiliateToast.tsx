'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store/store';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { AFFILIATE_OFFERS } from '@/lib/growth/affiliate-offers';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

interface Props {
    platform?: string;
}

export function ContextualAffiliateToast({ platform }: Props) {
    const { isParsed } = useAppStore();
    const { toast } = useToast();
    const hasToasted = useRef(false);

    useEffect(() => {
        // Reset ref if parsing state resets (e.g. they clear the input)
        if (!isParsed) {
            hasToasted.current = false;
            return;
        }

        if (!platform || hasToasted.current) return;

        // Find matching affiliate data based on URL slug
        const key = platform.split('-')[0].toLowerCase();

        // We only trigger affiliate toasts for designated top-tier platforms
        const data = AFFILIATE_OFFERS[key];

        if (!data) return; // Silent if no contextual affiliate exists

        hasToasted.current = true;

        const timer = setTimeout(() => {
            trackConversionEvent('affiliate_toast_shown', {
                platform: key,
                placement: 'toast',
            });

            toast({
                title: data.title,
                description: data.description,
                action: (
                    <ToastAction altText={data.cta} asChild>
                        <a
                            href={data.link}
                            target="_blank"
                            rel="noopener noreferrer nofollow sponsored"
                            onClick={() =>
                                trackConversionEvent('affiliate_toast_click', {
                                    platform: key,
                                    destination: data.link,
                                })
                            }
                        >
                            {data.cta}
                        </a>
                    </ToastAction>
                ),
                duration: 8000,
            });
        }, 3000); // Wait 3 seconds after successful parse

        return () => clearTimeout(timer);
    }, [isParsed, platform, toast]);

    return null; // Invisible component
}
