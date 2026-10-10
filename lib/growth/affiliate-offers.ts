/**
 * Contextual affiliate offers, shown as a toast ~3s after a successful parse.
 *
 * HARD RULE: every link in this file must carry a referral identifier that
 * actually pays us. A plain URL with UTM params is not an affiliate link — it
 * is a free outbound referral that costs us the highest-intent moment on the
 * site and, because the toast viewport sits at z-[100] over PostExportUpsell's
 * z-50, can render on top of the $9 Pro CTA that does pay.
 *
 * Audited 2026-10-10: six of seven offers (Baremetrics, Coefficient,
 * Supermetrics, MongoDB BI, EasyBI, and the sidebar's Zapier/Notion) carried
 * no referral id at all. They were earning exactly $0 while occupying that
 * slot, so they are gone. Coupler.io (ref=john70) is the one approved partner
 * and is the only destination here.
 *
 * Copy constraint: Coupler.io advertises 300+ sources but publishes no stable
 * per-connector list we can cite, and only HubSpot and Shopify are confirmed
 * by name on its Workspace Marketplace listing. So the specific-integration
 * claim is made ONLY for those two. Every other platform gets copy that is
 * true regardless of which connectors exist, rather than a claim we would be
 * guessing at.
 *
 * Adding an offer: get accepted into the programme first, put the real ref in
 * the URL, and only then add a key here.
 */

export interface AffiliateOffer {
    title: string;
    description: string;
    cta: string;
    link: string;
}

/** The single approved affiliate destination.
 *
 *  This is the "Signup page" link from the FirstPromoter partner dashboard,
 *  not the marketing homepage one. Both carry the same `ref=john70` payout
 *  identifier and both are tracked, but this toast only fires AFTER a
 *  successful conversion — the user is already warm and the toast copy has
 *  already made the pitch, so sending them to the homepage makes them re-read
 *  a sales page before they can act. The sidebar, which is ambient and cold,
 *  keeps the homepage link instead (see lib/affiliates.ts).
 *
 *  `ref` is the payout identifier — do not strip it when editing these URLs.
 *  Verified 2026-10-10: loading a ?ref=john70 URL sets `_fprom_ref=john70`
 *  plus a FirstPromoter tracking id, and the partner dashboard lists this
 *  exact link under "Referral links". */
const COUPLER_BASE = 'https://app.coupler.io/register/sign_up?ref=john70';

function couplerLink(platform: string): string {
    const url = new URL(COUPLER_BASE);
    url.searchParams.set('utm_source', 'jsonexport');
    url.searchParams.set('utm_medium', 'affiliate_toast');
    url.searchParams.set('utm_campaign', 'phase4_growth_execution');
    url.searchParams.set('utm_content', platform);
    return url.toString();
}

export const AFFILIATE_OFFERS: Record<string, AffiliateOffer> = {
    shopify: {
        title: 'Shopify Line Items Flattened! 🛍️',
        description:
            'Doing this every week? Coupler.io syncs Shopify straight into Sheets and Excel on a schedule, no export step.',
        cta: 'Automate with Coupler.io',
        link: couplerLink('shopify'),
    },
    hubspot: {
        title: 'HubSpot Properties Flattened! 🟧',
        description:
            'Stop re-exporting the same CRM data. Coupler.io pulls HubSpot into Sheets and Excel automatically.',
        cta: 'Automate with Coupler.io',
        link: couplerLink('hubspot'),
    },
    // Generic framing: true regardless of which specific connector exists.
    stripe: {
        title: 'Stripe Metadata Cleaned! 💳',
        description:
            'If this is a recurring report, Coupler.io can keep 300+ data sources flowing into Sheets and Excel on a schedule.',
        cta: 'See Coupler.io',
        link: couplerLink('stripe'),
    },
    salesforce: {
        title: 'Salesforce Export Fixed! ☁️',
        description:
            'Running this monthly? Coupler.io automates recurring syncs from 300+ sources into Sheets and Excel.',
        cta: 'See Coupler.io',
        link: couplerLink('salesforce'),
    },
    jira: {
        title: 'Jira Custom Fields Extracted! 🎟️',
        description:
            'Rebuilding this report each sprint? Coupler.io can schedule the sync into Sheets and Excel instead.',
        cta: 'See Coupler.io',
        link: couplerLink('jira'),
    },
};
