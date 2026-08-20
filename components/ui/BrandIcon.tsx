import React from 'react';
import { cn } from '@/lib/utils';

export interface BrandIconProps {
    platform?: string;
    format?: 'json' | 'csv' | 'xml' | 'excel' | 'xlsx' | 'tsv' | 'yaml' | 'html' | 'docx' | 'zip' | string;
    className?: string;
    size?: number | string;
    variant?: 'icon' | 'badge' | 'monogram';
}

/**
 * Official Brand Color Definitions
 */
export const BRAND_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
    stripe: { bg: 'bg-[#635BFF]/10', text: 'text-[#635BFF]', hex: '#635BFF' },
    shopify: { bg: 'bg-[#95BF47]/10', text: 'text-[#95BF47]', hex: '#95BF47' },
    salesforce: { bg: 'bg-[#00A1E0]/10', text: 'text-[#00A1E0]', hex: '#00A1E0' },
    hubspot: { bg: 'bg-[#FF7A59]/10', text: 'text-[#FF7A59]', hex: '#FF7A59' },
    jira: { bg: 'bg-[#0052CC]/10', text: 'text-[#0052CC]', hex: '#0052CC' },
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
    timetonic: { bg: 'bg-[#1B365D]/10', text: 'text-[#1B365D] dark:text-sky-400', hex: '#1B365D' },
    // File Formats
    json: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', hex: '#F59E0B' },
    csv: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', hex: '#10B981' },
    xml: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', hex: '#F97316' },
    excel: { bg: 'bg-green-600/10', text: 'text-green-700 dark:text-green-400', hex: '#107C41' },
    xlsx: { bg: 'bg-green-600/10', text: 'text-green-700 dark:text-green-400', hex: '#107C41' },
    tsv: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', hex: '#3B82F6' },
    yaml: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', hex: '#F43F5E' },
};

/**
 * Normalizes platform strings to canonical registry keys
 */
export function normalizePlatformKey(raw?: string): string {
    if (!raw) return '';
    const clean = raw.toLowerCase().trim();
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
    if (clean.includes('quickbooks')) return 'quickbooks';
    if (clean.includes('intercom')) return 'intercom';
    if (clean.includes('typeform')) return 'typeform';
    if (clean.includes('dropbox')) return 'dropbox';
    if (clean.includes('mailchimp')) return 'mailchimp';
    if (clean.includes('onedrive')) return 'onedrive';
    if (clean.includes('google') || clean.includes('gmb')) return 'google-my-business';
    if (clean.includes('clockify')) return 'clockify';
    if (clean.includes('calendly')) return 'calendly';
    if (clean.includes('mixpanel')) return 'mixpanel';
    if (clean.includes('amplitude')) return 'amplitude';
    if (clean.includes('make')) return 'make-com';
    if (clean.includes('slack')) return 'slack';
    if (clean.includes('discord')) return 'discord';
    if (clean.includes('mongo')) return 'mongodb';
    if (clean.includes('postgres')) return 'postgresql';
    if (clean.includes('youtube')) return 'youtube';
    if (clean.includes('timetonic')) return 'timetonic';
    if (clean.includes('csv')) return 'csv';
    if (clean.includes('xml')) return 'xml';
    if (clean.includes('excel') || clean.includes('xlsx')) return 'excel';
    if (clean.includes('json')) return 'json';
    return clean;
}

/**
 * Returns clean initials for monogram avatar fallback
 */
function getMonogramText(name: string): string {
    const parts = name.replace(/[-_]/g, ' ').split(' ').filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

/**
 * Deterministic color picker for unindexed platforms
 */
function getDeterministicColor(str: string): { bg: string; text: string; hex: string } {
    const palette = [
        { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', hex: '#6366F1' },
        { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', hex: '#06B6D4' },
        { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', hex: '#8B5CF6' },
        { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', hex: '#EC4899' },
        { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', hex: '#14B8A6' },
        { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', hex: '#F59E0B' },
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
}

export function BrandIcon({ platform, format, className, size }: BrandIconProps) {
    const key = format ? format.toLowerCase() : normalizePlatformKey(platform);
    const baseClass = cn("inline-block shrink-0 transition-transform duration-200", className);
    const style = size ? { width: size, height: size } : undefined;

    switch (key) {
        // ==================== FORMAT ICONS ====================
        case 'json':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#F59E0B" fillOpacity="0.15" />
                    <path d="M7 8C7 6.5 8 6 9.5 6M7 16C7 17.5 8 18 9.5 18M7 12H5M17 8C17 6.5 16 6 14.5 6M17 16C17 17.5 16 18 14.5 18M17 12H19" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="12" r="1" fill="#F59E0B" />
                    <circle cx="14" cy="12" r="1" fill="#F59E0B" />
                </svg>
            );

        case 'csv':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#10B981" fillOpacity="0.15" />
                    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#10B981" strokeWidth="1.6" />
                    <path d="M5 10H19M5 14H19M10 5V19M14 5V19" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
            );

        case 'xml':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#F97316" fillOpacity="0.15" />
                    <path d="M8 8.5L4.5 12L8 15.5M16 8.5L19.5 12L16 15.5M13.5 6.5L10.5 17.5" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );

        case 'excel':
        case 'xlsx':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#107C41" fillOpacity="0.15" />
                    <path d="M6 4.5H18C18.8284 4.5 19.5 5.17157 19.5 6V18C19.5 18.8284 18.8284 19.5 18 19.5H6C5.17157 19.5 4.5 18.8284 4.5 18V6C4.5 5.17157 5.17157 4.5 6 4.5Z" stroke="#107C41" strokeWidth="1.5" />
                    <path d="M8.5 9L15.5 15M15.5 9L8.5 15" stroke="#107C41" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );

        // ==================== PLATFORM BRAND ICONS ====================
        case 'stripe':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#635BFF" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.915 0-1.178 1.108-1.72 2.727-1.72 2.062 0 4.103.743 4.103.743l.568-2.585s-1.886-.774-4.577-.774c-4.137 0-6.19 1.952-6.19 5.38 0 4.298 5.732 4.608 5.732 7.026 0 1.255-1.405 1.89-3.372 1.89-2.71 0-5.145-1.037-5.145-1.037l-.647 2.74s2.217.82 4.972.82c4.326 0 6.648-2.014 6.648-5.38 0-4.639-5.463-4.996-5.463-7.187 0-1.022 1.12-1.611 2.82-1.611 1.703 0 2.946.542 2.946.542l.535 2.528s-1.04.604-2.3 1.05z" />
                </svg>
            );

        case 'shopify':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#95BF47" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.34 6.15C18.25 5.65 15.54 4.56 12.2 5L12 5 10.4 23.4l11.1-6.5L19.34 6.15zM13.4 18.9c-2.1.4-3.5-1-3.1-3.2.2-1.2 1.1-2.2 2.3-2.4 2.1-.4 3.5 1 3.1 3.2-.2 1.2-1.1 2.2-2.3 2.4z" />
                    <path fillOpacity="0.8" d="M12 5C8.66 4.56 5.95 5.65 4.86 6.15L2.66 16.9l11.1 6.5L12 5z" />
                    <path d="M13.2 4.6l-1.9-3.8c-.3-.6-1-.9-1.6-.6-.2.1-.4.2-.5.4L6.9 4.7c2-.3 4.2-.4 6.3-.1z" fill="#5E8E3E" />
                </svg>
            );

        case 'salesforce':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#00A1E0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.244 17.819 10.034C17.494 6.464 14.532 3.5 11 3.5C7.171 3.5 3.991 6.302 3.559 10.036C1.52 10.457 0 12.274 0 14.5C0 16.9853 2.01472 19 4.5 19H17.5Z" />
                </svg>
            );

        case 'hubspot':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#FF7A59" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.8 9.2V6.6c.9-.4 1.5-1.3 1.5-2.3 0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 1 .6 1.9 1.5 2.3v2.6c-1.3.5-2.4 1.4-3 2.5l-5.6-4.4c.1-.3.1-.6.1-.9 0-2-1.6-3.6-3.6-3.6S.7 4.4.7 6.4s1.6 3.6 3.6 3.6c.7 0 1.4-.2 2-.6l5.4 4.3c-.6 1-.9 2.2-.9 3.5 0 3.7 3 6.8 6.8 6.8s6.8-3 6.8-6.8c0-3.4-2.5-6.2-5.6-6.6zm-1.2-5.9c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zM4.3 8.2c-1 0-1.8-.8-1.8-1.8S3.3 4.6 4.3 4.6s1.8.8 1.8 1.8-.8 1.8-1.8 1.8zm13.3 13.5c-2.4 0-4.4-2-4.4-4.4s2-4.4 4.4-4.4 4.4 2 4.4 4.4-2 4.4-4.4 4.4z" />
                </svg>
            );

        case 'jira':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.53 2C6.45 2 2.33 6.12 2.33 11.2c0 5.08 4.12 9.2 9.2 9.2h9.13v-9.2C20.66 6.12 16.54 2 11.53 2z" fill="#0052CC" />
                    <path d="M11.53 17.13c-3.28 0-5.93-2.65-5.93-5.93s2.65-5.93 5.93-5.93 5.93 2.65 5.93 5.93-2.65 5.93-5.93 5.93z" fill="#2684FF" />
                    <path d="M11.53 14.93c-2.06 0-3.73-1.67-3.73-3.73s1.67-3.73 3.73-3.73 3.73 1.67 3.73 3.73-1.67 3.73-3.73 3.73z" fill="#0052CC" />
                </svg>
            );

        case 'trello':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#0079BF" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="4.5" fill="#0079BF" />
                    <rect x="4.5" y="4.5" width="6" height="11" rx="1.5" fill="white" />
                    <rect x="13.5" y="4.5" width="6" height="7" rx="1.5" fill="white" />
                </svg>
            );

        case 'asana':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#F06A6A" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="7" r="4" fill="#F06A6A" />
                    <circle cx="6.5" cy="16.5" r="3.5" fill="#F06A6A" />
                    <circle cx="17.5" cy="16.5" r="3.5" fill="#F06A6A" />
                </svg>
            );

        case 'notion':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.4544 18.8953L9.27788 7.39868L6.84589 7.78864V16.8228L8.71186 17.1328V9.1687L14.4984 19.9882L17.1513 19.5633V8.40866L15.3045 8.0987V17.0628L15.4544 18.8953ZM4.22925 4.19531L6.65719 4.66031C8.05925 4.66031 7.21447 3.59537 17.9392 4.22749L17.2647 5.58046L19.3179 19.2608C19.4828 20.3958 19.7378 20.3008 19.5428 21.1627C19.4633 21.5147 19.1668 21.751 18.8318 21.722L6.15175 19.6641C5.64184 19.5816 5.25338 19.1578 5.22938 18.6404L4.00428 5.20525C3.96678 4.79278 4.22925 4.19531 4.22925 4.19531Z" />
                </svg>
            );

        case 'pipedrive':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#08A742" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#08A742" />
                    <path d="M11.5 6C8.5 6 6.5 8 6.5 11c0 2.2 1.2 3.8 3 4.5V20h3v-4.5c2.3-.5 4-2.5 4-4.5 0-3-2-5-5-5zm0 6.5c-1.4 0-2.3-.9-2.3-2s.9-2 2.3-2 2.3.9 2.3 2-.9 2-2.3 2z" fill="white" />
                </svg>
            );

        case 'quickbooks':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#2CA01C" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#2CA01C" />
                    <path d="M7.5 14.5c1.4 0 2.5-1.1 2.5-2.5V7H8.5v5c0 .6-.4 1-1 1s-1-.4-1-1V9H5v3c0 1.4 1.1 2.5 2.5 2.5zm9-5c-1.4 0-2.5 1.1-2.5 2.5V17h1.5v-5c0-.6.4-1 1-1s1 .4 1 1v3H19v-3c0-1.4-1.1-2.5-2.5-2.5z" fill="white" />
                </svg>
            );

        case 'xero':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#13B5EA" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#13B5EA" />
                    <path d="M7 8.5L9.5 12L7 15.5H8.8L10.4 13.2L12 15.5H13.8L11.3 12L13.8 8.5H12L10.4 10.8L8.8 8.5H7ZM15 15.5H16.8V8.5H15V15.5Z" fill="white" />
                </svg>
            );

        case 'harvest':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#F36C00" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#F36C00" />
                    <path d="M7 6H10V18H7V6ZM14 6H17V18H14V6ZM10.5 10.5H13.5V13.5H10.5V10.5Z" fill="white" />
                </svg>
            );

        case 'intercom':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#0057FF" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#0057FF" />
                    <path d="M6.5 8C6.5 7.2 7.2 6.5 8 6.5H16C16.8 6.5 17.5 7.2 17.5 8V14C17.5 14.8 16.8 15.5 16 15.5H14.5L12 18L9.5 15.5H8C7.2 15.5 6.5 14.8 6.5 14V8Z" fill="white" />
                    <circle cx="9.5" cy="11" r="1" fill="#0057FF" />
                    <circle cx="12" cy="11" r="1" fill="#0057FF" />
                    <circle cx="14.5" cy="11" r="1" fill="#0057FF" />
                </svg>
            );

        case 'typeform':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#262627" />
                    <path d="M7 8.5H17V10.5H13V17H11V10.5H7V8.5Z" fill="white" />
                </svg>
            );

        case 'dropbox':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#0061FF" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3.5L12 7.5L6 11.5L0 7.5L6 3.5ZM18 3.5L24 7.5L18 11.5L12 7.5L18 3.5ZM0 15.5L6 19.5L12 15.5L6 11.5L0 15.5ZM24 15.5L18 11.5L12 15.5L18 19.5L24 15.5ZM6 21L12 17L18 21L12 24.5L6 21Z" />
                </svg>
            );

        case 'mailchimp':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#FFE01B" />
                    <path d="M12 5.5C8.4 5.5 5.5 8.4 5.5 12C5.5 15.6 8.4 18.5 12 18.5C15.6 18.5 18.5 15.6 18.5 12C18.5 8.4 15.6 5.5 12 5.5ZM10 10.5C10.6 10.5 11 10.9 11 11.5C11 12.1 10.6 12.5 10 12.5C9.4 12.5 9 12.1 9 11.5C9 10.9 9.4 10.5 10 10.5ZM14 10.5C14.6 10.5 15 10.9 15 11.5C15 12.1 14.6 12.5 14 12.5C13.4 12.5 13 12.1 13 11.5C13 10.9 13.4 10.5 14 10.5ZM12 16.5C10.3 16.5 9 15.5 8.5 14.5H15.5C15 15.5 13.7 16.5 12 16.5Z" fill="#241C15" />
                </svg>
            );

        case 'onedrive':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#0078D4" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.6 7.2C14.8 5.7 16.7 4.8 18.7 5.1C21.1 5.4 23 7.5 23 10C23 10.4 22.9 10.9 22.8 11.3C23.5 12 24 13 24 14.1C24 16.3 22.2 18 20 18H7.5C4.5 18 2 15.5 2 12.5C2 9.8 4 7.5 6.7 7.1C7.8 4.7 10.2 3.2 13 3.5C15.2 3.7 17.1 5 18 6.8C16.8 6.5 15.5 6.7 14.4 7.3L13.6 7.2Z" />
                </svg>
            );

        case 'google-my-business':
        case 'google':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
            );

        case 'clockify':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#03A9F4" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#03A9F4" />
                    <path d="M12 6.5V12.5L16 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );

        case 'calendly':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#006BFF" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#006BFF" />
                    <path d="M7 6H17C18.1 6 19 6.9 19 8V17C19 18.1 18.1 19 17 19H7C5.9 19 5 18.1 5 17V8C5 6.9 5.9 6 7 6Z" fill="white" />
                    <path d="M5 10H19M9 4V7M15 4V7" stroke="#006BFF" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="14.5" r="1.5" fill="#006BFF" />
                </svg>
            );

        case 'mixpanel':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#7856FF" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#7856FF" />
                    <path d="M6 16.5V14M10 16.5V9.5M14 16.5V12M18 16.5V7.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
            );

        case 'amplitude':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#1E61F0" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#1E61F0" />
                    <path d="M6 17L10 8L13.5 14.5L16 10L18.5 17H6Z" fill="white" />
                </svg>
            );

        case 'make-com':
        case 'make':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#6D28D9" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#6D28D9" />
                    <path d="M6.5 15.5L10.5 7.5L14 13L17.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );

        case 'slack':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#36C5F0" d="M6 15a2.5 2.5 0 1 1-2.5-2.5H6v2.5zm1.5 0a2.5 2.5 0 1 1 2.5 2.5H8.5V15zm0-4V8.5a2.5 2.5 0 1 1 2.5 2.5H7.5z" />
                    <path fill="#2EB67D" d="M15 6a2.5 2.5 0 1 1 2.5 2.5H15V6zm-1.5 0a2.5 2.5 0 1 1-2.5-2.5H13.5V6zm0 4V8.5a2.5 2.5 0 1 1-2.5-2.5H13.5z" />
                    <path fill="#ECB22E" d="M18 15a2.5 2.5 0 1 1 2.5 2.5H18v-2.5zm-1.5 0a2.5 2.5 0 1 1-2.5-2.5H16.5V15zm0 4v2.5a2.5 2.5 0 1 1-2.5-2.5H16.5z" />
                    <path fill="#E01E5A" d="M9 18a2.5 2.5 0 1 1-2.5-2.5H9V18zm1.5 0a2.5 2.5 0 1 1 2.5-2.5H10.5V18zm0-4v-2.5a2.5 2.5 0 1 1 2.5 2.5H10.5z" />
                </svg>
            );

        case 'discord':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-2.313-9.117-3.953-11.758a.075.075 0 0 0-.032-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
            );

        case 'mongodb':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.0003 2.5C14.4703 6.73 15.6903 11.67 15.6903 13.73C15.6903 15.5 15.1403 15.87 14.4903 15.87C13.9503 15.87 13.4003 15.55 13.1903 15.4L13.2203 14.72C13.5003 11.91 14.3003 6.49 12.0003 2.5Z" fill="#116149" />
                    <path d="M10.5803 13.27C9.8603 12.02 9.0103 9.37 9.0103 7.23C9.0103 6.08 9.1803 5.14 9.4403 4.35C8.9303 5.43 5.0003 8.94 5.0003 13.91C5.0003 16.12 5.9603 18.05 7.0003 19.28C7.5603 17.8 8.5503 15.06 10.5103 13.27H10.5803Z" fill="#13AA52" />
                    <path d="M11.6603 14.38C11.4403 15.06 11.2403 15.86 11.2403 16.51C11.2403 18.07 12.4003 18.96 13.9903 19.61C13.6103 20.06 12.8403 20.88 11.5303 20.88C9.9303 20.88 9.1303 19.74 8.9803 18.59C8.7103 16.57 9.5703 13.79 11.6603 14.38Z" fill="#116149" />
                </svg>
            );

        case 'postgresql':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#336791" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.0003 0C5.37286 0 0.00025177 5.37257 0.00025177 12C0.00025177 18.6274 5.37286 24 12.0003 24C18.6277 24 24.0003 18.6274 24.0003 12C24.0003 5.37257 18.6277 0 12.0003 0ZM17.1431 16.2858H15.0003V12.0001H17.1431V16.2858ZM12.8574 16.2858H10.7145V8.57149H12.8574V16.2858ZM8.57168 16.2858H6.42882V12.0001H8.57168V16.2858Z" />
                </svg>
            );

        case 'youtube':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            );

        case 'timetonic':
            return (
                <svg className={baseClass} style={style} viewBox="0 0 24 24" fill="#1B365D" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="5" fill="#1B365D" />
                    <path d="M6 7H18V9.5H13.5V17.5H10.5V9.5H6V7Z" fill="white" />
                </svg>
            );

        // ==================== SMART BRANDED MONOGRAM FALLBACK ====================
        default: {
            const rawLabel = platform || format || 'Data';
            const initials = getMonogramText(rawLabel);
            const brandColor = BRAND_COLORS[key] || getDeterministicColor(rawLabel);

            return (
                <div
                    className={cn(
                        "flex items-center justify-center rounded-lg font-bold border border-border/50 select-none shadow-sm",
                        brandColor.bg,
                        brandColor.text,
                        baseClass
                    )}
                    style={style}
                    title={rawLabel}
                >
                    <span className="text-[11px] font-black tracking-tight leading-none">
                        {initials}
                    </span>
                </div>
            );
        }
    }
}
