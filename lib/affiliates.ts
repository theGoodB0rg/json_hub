import { PARTNERS, buildAffiliateLink } from './affiliates-core';

export interface AffiliatePartner {
    id: string;
    name: string;
    description: string;
    benefit: string;
    logoUrl: string; // We'll use lucide icons for now if no image
    affiliateUrl: string;
    bgColor: string;
    textColor: string;
}

/**
 * Sidebar partners.
 *
 * HARD RULE (same as lib/growth/affiliate-offers.ts): every entry must carry a
 * referral identifier that actually pays us. Zapier and Notion were listed
 * here with bare homepage URLs — no referral id, no revenue — while taking up
 * a persistent 256px rail next to the converter output. Removed 2026-10-10.
 *
 * Coupler.io (ref=jsonexport) is the one approved programme. Re-apply to others
 * once the Pro funnel gives us a conversion rate to pitch with; until then an
 * empty slot costs nothing and a free outbound link costs attention.
 */
export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
    {
        id: 'coupler',
        name: 'Coupler.io',
        description: 'Auto-sync live API endpoints directly to Sheets & Excel.',
        benefit: 'Automate Spreadsheet Sync',
        logoUrl: '/images/partners/coupler.svg',
        // Homepage link, not the signup-page one the post-parse toast uses.
        // The sidebar is ambient and shows to people who have not converted
        // anything yet and may never have heard of Coupler — dropping a cold
        // visitor straight onto a registration form converts worse than
        // letting the marketing page make the case first.
        // `ref=jsonexport` is the payout identifier — do not strip it. The URL is
        // built by lib/affiliates-core.ts so UTM + payout params stay central.
        affiliateUrl: buildAffiliateLink('coupler', { placement: 'affiliate_sidebar' }),
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-600',
    },
    {
        id: 'systeme',
        name: 'systeme.io',
        description: 'Funnels, email marketing & course sales on a free plan.',
        benefit: 'Sell & Email Your List Free',
        logoUrl: '/images/partners/systeme.svg',
        // Same placement rule as Coupler: ambient sidebar gets the homepage
        // so the marketing page makes the case; `sa=` is the payout id.
        affiliateUrl: buildAffiliateLink('systeme', { placement: 'affiliate_sidebar' }),
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600',
    },
];

// Re-exported for tests and future multi-partner rotation.
export { PARTNERS };

