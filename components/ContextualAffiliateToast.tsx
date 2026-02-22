'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store/store';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

interface Props {
    platform?: string;
}

const AFFILIATE_DATA: Record<string, { title: string, description: string, cta: string, link: string }> = {
    'stripe': {
        title: "Stripe Metadata Cleaned! 💳",
        description: "Tired of dealing with raw Stripe JSON? Use Baremetrics to sync Stripe directly to your dashboard.",
        cta: "Try Baremetrics Free",
        link: "#"
    },
    'salesforce': {
        title: "Salesforce Export Fixed! ☁️",
        description: "Need an automated way to pull Salesforce API dumps into beautiful Excel reports?",
        cta: "Explore Coefficient",
        link: "#"
    },
    'hubspot': {
        title: "HubSpot Properties Flattened! 🟧",
        description: "Stop manually fixing HubSpot exports. Automate your CRM reporting instantly.",
        cta: "Get Supermetrics",
        link: "#"
    },
    'shopify': {
        title: "Shopify Line Items Flattened! 🛍️",
        description: "Need to sync Shopify orders to Airtable or Sheets without writing JSON scripts?",
        cta: "Try Make.com",
        link: "#"
    },
    'mongodb': {
        title: "MongoDB Documents Flattened! 🍃",
        description: "Analyze MongoDB data instantly. Looking for a native Mongo BI connector?",
        cta: "View MongoDB BI",
        link: "#"
    },
    'jira': {
        title: "Jira Custom Fields Extracted! 🎟️",
        description: "Stop fighting Jira's REST API. Use EasyBI to build custom Jira reports natively.",
        cta: "Try EasyBI",
        link: "#"
    }
};

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
        const data = AFFILIATE_DATA[key];

        if (!data) return; // Silent if no contextual affiliate exists

        hasToasted.current = true;

        const timer = setTimeout(() => {
            toast({
                title: data.title,
                description: data.description,
                action: (
                    <ToastAction altText={data.cta} asChild>
                        <a href={data.link} target="_blank" rel="noopener noreferrer">
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
