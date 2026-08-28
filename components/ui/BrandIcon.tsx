import React from 'react';
import { cn } from '@/lib/utils';
import {
    siShopify,
    siStripe,
    siHubspot,
    siJirasoftware,
    siTrello,
    siAsana,
    siNotion,
    siXero,
    siQuickbooks,
    siIntercom,
    siTypeform,
    siDropbox,
    siMailchimp,
    siClockify,
    siCalendly,
    siMixpanel,
    siMake,
    siDiscord,
    siMongodb,
    siPostgresql,
    siYoutube,
    siGoogle,
    siGooglesheets,
    siAirtable,
    siZendesk,
    siGithub,
    siGitlab,
    siClickup,
    siLinear,
    siPostman,
    siFigma,
    type SimpleIcon,
} from 'simple-icons';

export interface BrandIconProps {
    platform?: string;
    format?: 'json' | 'csv' | 'xml' | 'excel' | 'xlsx' | 'tsv' | 'yaml' | 'html' | 'docx' | 'zip' | string;
    className?: string;
    size?: number | string;
    variant?: 'icon' | 'badge' | 'monogram';
}

/**
 * Official SimpleIcons Map
 */
const SIMPLE_ICONS_MAP: Record<string, SimpleIcon> = {
    shopify: siShopify,
    stripe: siStripe,
    hubspot: siHubspot,
    jira: siJirasoftware,
    'jira-software': siJirasoftware,
    trello: siTrello,
    asana: siAsana,
    notion: siNotion,
    xero: siXero,
    quickbooks: siQuickbooks,
    intercom: siIntercom,
    typeform: siTypeform,
    dropbox: siDropbox,
    mailchimp: siMailchimp,
    clockify: siClockify,
    calendly: siCalendly,
    mixpanel: siMixpanel,
    make: siMake,
    'make-com': siMake,
    discord: siDiscord,
    mongodb: siMongodb,
    postgresql: siPostgresql,
    youtube: siYoutube,
    'youtube-analytics': siYoutube,
    google: siGoogle,
    'google-sheets': siGooglesheets,
    'google-drive': siGoogle,
    'google-my-business': siGoogle,
    airtable: siAirtable,
    zendesk: siZendesk,
    github: siGithub,
    gitlab: siGitlab,
    clickup: siClickup,
    linear: siLinear,
    postman: siPostman,
    figma: siFigma,
};

/**
 * Official Brand Color Definitions
 */
export const BRAND_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
    postman: { bg: 'bg-[#FF6C37]/10', text: 'text-[#FF6C37]', hex: '#FF6C37' },
    figma: { bg: 'bg-[#F24E1E]/10', text: 'text-[#F24E1E]', hex: '#F24E1E' },
    stripe: { bg: 'bg-[#635BFF]/10', text: 'text-[#635BFF]', hex: '#635BFF' },
    shopify: { bg: 'bg-[#7AB55C]/10', text: 'text-[#7AB55C]', hex: '#7AB55C' },
    salesforce: { bg: 'bg-[#00A1E0]/10', text: 'text-[#00A1E0]', hex: '#00A1E0' },
    hubspot: { bg: 'bg-[#FF7A59]/10', text: 'text-[#FF7A59]', hex: '#FF7A59' },
    jira: { bg: 'bg-[#0052CC]/10', text: 'text-[#0052CC]', hex: '#0052CC' },
    'jira-software': { bg: 'bg-[#0052CC]/10', text: 'text-[#0052CC]', hex: '#0052CC' },
    trello: { bg: 'bg-[#0079BF]/10', text: 'text-[#0079BF]', hex: '#0079BF' },
    asana: { bg: 'bg-[#F06A6A]/10', text: 'text-[#F06A6A]', hex: '#F06A6A' },
    notion: { bg: 'bg-black/10 dark:bg-white/10', text: 'text-black dark:text-white', hex: '#000000' },
    pipedrive: { bg: 'bg-[#08A742]/10', text: 'text-[#08A742]', hex: '#08A742' },
    harvest: { bg: 'bg-[#F36C00]/10', text: 'text-[#F36C00]', hex: '#F36C00' },
    xero: { bg: 'bg-[#13B5EA]/10', text: 'text-[#13B5EA]', hex: '#13B5EA' },
    quickbooks: { bg: 'bg-[#2CA01C]/10', text: 'text-[#2CA01C]', hex: '#2CA01C' },
    intercom: { bg: 'bg-[#0057FF]/10', text: 'text-[#0057FF]', hex: '#0057FF' },
    typeform: { bg: 'bg-[#262627]/10 dark:bg-white/10', text: 'text-[#262627] dark:text-white', hex: '#262627' },
    dropbox: { bg: 'bg-[#0061FF]/10', text: 'text-[#0061FF]', hex: '#0061FF' },
    mailchimp: { bg: 'bg-[#FFE01B]/20', text: 'text-amber-700 dark:text-amber-300', hex: '#FFE01B' },
    onedrive: { bg: 'bg-[#0078D4]/10', text: 'text-[#0078D4]', hex: '#0078D4' },
    'google-my-business': { bg: 'bg-[#4285F4]/10', text: 'text-[#4285F4]', hex: '#4285F4' },
    google: { bg: 'bg-[#4285F4]/10', text: 'text-[#4285F4]', hex: '#4285F4' },
    'google-sheets': { bg: 'bg-[#34A853]/10', text: 'text-[#34A853]', hex: '#34A853' },
    'google-drive': { bg: 'bg-[#4285F4]/10', text: 'text-[#4285F4]', hex: '#4285F4' },
    clockify: { bg: 'bg-[#03A9F4]/10', text: 'text-[#03A9F4]', hex: '#03A9F4' },
    calendly: { bg: 'bg-[#006BFF]/10', text: 'text-[#006BFF]', hex: '#006BFF' },
    mixpanel: { bg: 'bg-[#7856FF]/10', text: 'text-[#7856FF]', hex: '#7856FF' },
    amplitude: { bg: 'bg-[#1E61F0]/10', text: 'text-[#1E61F0]', hex: '#1E61F0' },
    'make-com': { bg: 'bg-[#6D28D9]/10', text: 'text-[#8B5CF6]', hex: '#8B5CF6' },
    make: { bg: 'bg-[#6D28D9]/10', text: 'text-[#8B5CF6]', hex: '#8B5CF6' },
    slack: { bg: 'bg-[#4A154B]/10', text: 'text-[#4A154B] dark:text-[#E01E5A]', hex: '#4A154B' },
    discord: { bg: 'bg-[#5865F2]/10', text: 'text-[#5865F2]', hex: '#5865F2' },
    mongodb: { bg: 'bg-[#13AA52]/10', text: 'text-[#13AA52]', hex: '#13AA52' },
    postgresql: { bg: 'bg-[#336791]/10', text: 'text-[#336791]', hex: '#336791' },
    youtube: { bg: 'bg-[#FF0000]/10', text: 'text-[#FF0000]', hex: '#FF0000' },
    'youtube-analytics': { bg: 'bg-[#FF0000]/10', text: 'text-[#FF0000]', hex: '#FF0000' },
    airtable: { bg: 'bg-[#18BFFF]/10', text: 'text-[#18BFFF]', hex: '#18BFFF' },
    zendesk: { bg: 'bg-[#03363D]/10', text: 'text-[#03363D] dark:text-teal-400', hex: '#03363D' },
    github: { bg: 'bg-black/10 dark:bg-white/10', text: 'text-black dark:text-white', hex: '#181717' },
    gitlab: { bg: 'bg-[#FC6D26]/10', text: 'text-[#FC6D26]', hex: '#FC6D26' },
    clickup: { bg: 'bg-[#7B68EE]/10', text: 'text-[#7B68EE]', hex: '#7B68EE' },
    linear: { bg: 'bg-[#5E6AD2]/10', text: 'text-[#5E6AD2]', hex: '#5E6AD2' },
    timetonic: { bg: 'bg-[#1B365D]/10', text: 'text-[#1B365D] dark:text-sky-400', hex: '#1B365D' },
    // File Formats
    json: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', hex: '#F59E0B' },
    csv: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', hex: '#10B981' },
    xml: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', hex: '#F97316' },
    excel: { bg: 'bg-green-600/10', text: 'text-green-700 dark:text-green-400', hex: '#107C41' },
    xlsx: { bg: 'bg-green-600/10', text: 'text-green-700 dark:text-green-400', hex: '#107C41' },
    tsv: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', hex: '#3B82F6' },
    yaml: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', hex: '#F43F5E' },
    html: { bg: 'bg-orange-600/10', text: 'text-orange-600', hex: '#E34F26' },
};

/**
 * Normalizes platform strings to canonical registry keys
 */
export function normalizePlatformKey(raw?: string): string {
    if (!raw) return '';
    const clean = raw.toLowerCase().trim();
    if (clean.includes('postman')) return 'postman';
    if (clean.includes('figma')) return 'figma';
    if (clean.includes('stripe')) return 'stripe';
    if (clean.includes('shopify')) return 'shopify';
    if (clean.includes('salesforce')) return 'salesforce';
    if (clean.includes('hubspot')) return 'hubspot';
    if (clean.includes('jira')) return 'jira';
    if (clean.includes('trello')) return 'trello';
    if (clean.includes('asana')) return 'asana';
    if (clean.includes('notion')) return 'notion';
    if (clean.includes('pipedrive')) return 'pipedrive';
    if (clean.includes('harvest')) return 'harvest';
    if (clean.includes('xero')) return 'xero';
    if (clean.includes('quickbook')) return 'quickbooks';
    if (clean.includes('intercom')) return 'intercom';
    if (clean.includes('typeform')) return 'typeform';
    if (clean.includes('dropbox')) return 'dropbox';
    if (clean.includes('mailchimp')) return 'mailchimp';
    if (clean.includes('onedrive')) return 'onedrive';
    if (clean.includes('google-sheets') || clean.includes('google sheets')) return 'google-sheets';
    if (clean.includes('google-drive') || clean.includes('google drive')) return 'google-drive';
    if (clean.includes('google')) return 'google';
    if (clean.includes('clockify')) return 'clockify';
    if (clean.includes('calendly')) return 'calendly';
    if (clean.includes('mixpanel')) return 'mixpanel';
    if (clean.includes('amplitude')) return 'amplitude';
    if (clean.includes('make.com') || clean.includes('make') || clean.includes('integromat')) return 'make';
    if (clean.includes('slack')) return 'slack';
    if (clean.includes('discord')) return 'discord';
    if (clean.includes('mongodb') || clean.includes('mongo')) return 'mongodb';
    if (clean.includes('postgres')) return 'postgresql';
    if (clean.includes('youtube')) return 'youtube';
    if (clean.includes('airtable')) return 'airtable';
    if (clean.includes('zendesk')) return 'zendesk';
    if (clean.includes('github')) return 'github';
    if (clean.includes('gitlab')) return 'gitlab';
    if (clean.includes('clickup')) return 'clickup';
    if (clean.includes('linear')) return 'linear';
    if (clean.includes('timetonic')) return 'timetonic';
    if (clean.includes('json')) return 'json';
    if (clean.includes('csv')) return 'csv';
    if (clean.includes('xml')) return 'xml';
    if (clean.includes('excel') || clean.includes('xlsx')) return 'excel';
    if (clean.includes('tsv')) return 'tsv';
    if (clean.includes('yaml')) return 'yaml';
    return clean;
}

/**
 * Universal Brand & Format Icon Component
 * Directly renders 100% authentic Simple Icons or official vector paths
 */
export function BrandIcon({
    platform,
    format,
    className,
    size,
    variant = 'icon',
}: BrandIconProps) {
    const rawKey = format || platform || '';
    const key = normalizePlatformKey(rawKey);
    const colorInfo = BRAND_COLORS[key] || {
        bg: 'bg-muted/50',
        text: 'text-muted-foreground',
        hex: '#64748B',
    };

    // 1. Check if format glyph requested
    if (format) {
        const fmt = format.toLowerCase();
        if (fmt === 'json') {
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn("text-amber-500", className)}
                    style={size ? { width: size, height: size } : undefined}
                >
                    <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
                    <path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
                </svg>
            );
        }
        if (fmt === 'csv' || fmt === 'tsv') {
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(colorInfo.text, className)}
                    style={size ? { width: size, height: size } : undefined}
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="16" y2="17" />
                </svg>
            );
        }
        if (fmt === 'xml' || fmt === 'html') {
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn("text-orange-500", className)}
                    style={size ? { width: size, height: size } : undefined}
                >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                    <line x1="14" y1="4" x2="10" y2="20" />
                </svg>
            );
        }
        if (fmt === 'excel' || fmt === 'xlsx') {
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={cn("text-[#107C41]", className)}
                    style={size ? { width: size, height: size } : undefined}
                >
                    <path d="M21.17 3.25q.33 0 .59.25t.24.58v15.84q0 .33-.24.58t-.59.25H7.83q-.33 0-.58-.25t-.25-.58V17.5H2.83q-.33 0-.58-.25t-.25-.58V7.33q0-.33.25-.58t.58-.25H7V4.08q0-.33.25-.58t.58-.25zm-.42 1.67H8.5v2.5h12.25zm0 4.16H8.5v2.5h12.25zm0 4.17H8.5v2.5h12.25zm0 4.17H8.5v2.5h12.25zM7 8.17H3.5v7.66H7zm-1.15 6.25-1.02-2.14-1.03 2.14H2.43l1.7-3.23-1.63-3.07h1.36l.96 2.05.95-2.05h1.36l-1.63 3.07 1.7 3.23z" />
                </svg>
            );
        }
    }

    // 2. Check official SimpleIcons dataset
    const simpleIcon = SIMPLE_ICONS_MAP[key];
    if (simpleIcon) {
        return (
            <svg
                role="img"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(colorInfo.text, className)}
                style={size ? { width: size, height: size } : undefined}
                xmlns="http://www.w3.org/2000/svg"
            >
                <title>{simpleIcon.title}</title>
                <path d={simpleIcon.path} />
            </svg>
        );
    }

    // 3. Official vector paths for platforms with custom license/not in core simple-icons
    if (key === 'slack') {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(colorInfo.text, className)}
                style={size ? { width: size, height: size } : undefined}
            >
                <title>Slack</title>
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
            </svg>
        );
    }

    if (key === 'salesforce') {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(colorInfo.text, className)}
                style={size ? { width: size, height: size } : undefined}
            >
                <title>Salesforce</title>
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
        );
    }

    if (key === 'onedrive') {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(colorInfo.text, className)}
                style={size ? { width: size, height: size } : undefined}
            >
                <title>Microsoft OneDrive</title>
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
        );
    }

    if (key === 'pipedrive') {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(colorInfo.text, className)}
                style={size ? { width: size, height: size } : undefined}
            >
                <title>Pipedrive</title>
                <circle cx="12" cy="9" r="6" />
                <path d="M6 9v11a2 2 0 0 0 2 2h2V9H6z" />
            </svg>
        );
    }

    if (key === 'harvest') {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(colorInfo.text, className)}
                style={size ? { width: size, height: size } : undefined}
            >
                <title>Harvest</title>
                <path d="M4 3h4.5v6.5h7V3H20v18h-4.5v-6.5h-7V21H4V3z" />
            </svg>
        );
    }

    if (key === 'amplitude') {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(colorInfo.text, className)}
                style={size ? { width: size, height: size } : undefined}
            >
                <title>Amplitude</title>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5v-9l6 4.5-6 4.5z" />
            </svg>
        );
    }

    if (key === 'timetonic') {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(colorInfo.text, className)}
                style={size ? { width: size, height: size } : undefined}
            >
                <title>TimeTonic</title>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" stroke="#ffffff" strokeWidth="2" fill="none" />
            </svg>
        );
    }

    // 4. Deterministic Branded Monogram Fallback
    const words = (platform || 'JH').trim().split(/[\s-_]+/);
    const initials = words.length > 1
        ? (words[0][0] + words[1][0]).toUpperCase()
        : words[0].slice(0, 2).toUpperCase();

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-bold text-xs shadow-sm select-none',
                colorInfo.bg,
                colorInfo.text,
                className
            )}
            style={size ? { width: size, height: size } : { width: '1.75rem', height: '1.75rem' }}
        >
            {initials}
        </span>
    );
}
