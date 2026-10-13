/**
 * Single source of truth for affiliate destinations.
 *
 * HARD RULE (audited 2026-10-10, enforced by tests/affiliates/): every link
 * produced here must carry a referral identifier that actually pays us. A
 * plain URL with UTM params is not an affiliate link — it is a free outbound
 * referral. `buildLinkForConfig` throws when `refCode` is empty so an
 * unapproved programme can never ship as a bare homepage link.
 *
 * Adding a partner:
 *   1. Get accepted into the programme FIRST (browser sweep runbook in docs).
 *   2. Put the real payout identifier in `refCode` below.
 *   3. Only then surface it via lib/affiliates.ts (sidebar) or
 *      lib/growth/affiliate-offers.ts (post-parse toast).
 *
 * Placement model: the sidebar is ambient/cold (homepage destination), the
 * toast fires AFTER a successful conversion (signup/register destination).
 */

export type AffiliatePlacement = 'affiliate_sidebar' | 'affiliate_toast';

export type AffiliateIntent = 'recurring-automation' | 'spreadsheet-followon' | 'ecommerce-marketing';

export type PartnerId = 'coupler' | 'systeme';

export interface AffiliateLinkSlot {
    placement: AffiliatePlacement;
    /** platform key, e.g. 'shopify' — becomes utm_content + sub-source tracking */
    platform?: string;
    /** extra campaign label, e.g. 'phase4_growth_execution' — becomes utm_campaign */
    campaign?: string;
}

export interface PartnerConfig {
    id: string;
    name: string;
    intent: AffiliateIntent;
    /** Cold/ambient destination (sidebar). */
    homeUrl: string;
    /** Warm/post-conversion destination (toast). */
    signupUrl: string;
    /**
     * Query param carrying the payout identifier (e.g. 'ref', 'pc').
     * Empty string = identity is embedded in the URL itself (e.g. Google
     * Workspace referral token link); `refCode` must still be non-empty.
     */
    refParam: string;
    /** The payout identifier. Empty = NOT approved — link building throws. */
    refCode: string;
    /**
     * Optional per-slot sub-tracking param (e.g. Make's `affiliateSource`).
     * Value is derived from placement/platform when present.
     */
    subSourceParam?: string;
}

const UTM_SOURCE = 'jsonexport';

export const PARTNERS: Record<PartnerId, PartnerConfig> = {
    coupler: {
        id: 'coupler',
        name: 'Coupler.io',
        intent: 'recurring-automation',
        // Homepage link for the ambient sidebar: cold visitors convert worse
        // on a bare registration form, so the marketing page makes the case.
        homeUrl: 'https://www.coupler.io/',
        // Signup-page link from the FirstPromoter dashboard for the warm toast.
        signupUrl: 'https://app.coupler.io/register/sign_up',
        refParam: 'ref',
        // `ref` is the payout identifier — do not strip it. Token changed
        // 2026-10-13 from `john70` to `jsonexport` via FirstPromoter
        // "Customize Token" (old links invalidated); new ?ref=jsonexport
        // links verified live in the partner dashboard the same day.
        // Payout admin deferred by owner until first earnings: W-8BEN
        // (non-US) not yet uploaded; payout method Bank selected.
        refCode: 'jsonexport',
    },
    systeme: {
        id: 'systeme',
        name: 'systeme.io',
        intent: 'ecommerce-marketing',
        // In-house programme, no application: every account auto-joins and
        // the dashboard issues the ?sa= payout identifier (verified live
        // 2026-10-11, re-verified 2026-10-13: exact match). 60% lifetime
        // recurring, lifetime attribution (permanent tag, not a 1-year
        // cookie), $30 minimum, monthly on the 10th, PayPal or wire
        // transfer. Owner intent 2026-10-13: wire transfer, but payout
        // method left unset until first earnings (needs domiciliary
        // IBAN/SWIFT then; NG receivability unconfirmed).
        homeUrl: 'https://systeme.io/',
        signupUrl: 'https://systeme.io/',
        refParam: 'sa',
        refCode: 'sa02119737182b52ac6c5278a1dc3073bfb6dbce8a',
    },
    // Approved-in-sweep partners are added here with real refCodes, e.g.:
    //   coefficient:      { ..., refParam: '<rewardful-param>', refCode: '<code>' }
    //   'google-workspace': { ..., refParam: '', refCode: '<referral-token>' }
    //   namecheap:         { ..., refParam: '<cj/imapct-param>', refCode: '<id>' }
    // Until then they stay OUT of this record — see the registry test.
    //
    // DEFERRED 2026-10-11 — payout-rail incompatible, not traffic-rejected:
    //   make: payouts exclusively via Wise; owner is NG-based on Payoneer /
    //   Nigerian banks, so the programme is unusable until that changes.
    //
    // BLOCKED 2026-10-13 — do not re-apply, do not re-sweep:
    //   partnerstack (network): repeated rejections with no path forward.
    //   Programmes run through Partnerstack are off-limits until the block
    //   is lifted here with a dated note. Reapplying wastes review cycles
    //   and risks flagging the account as spammy — skip Partnerstack rows
    //   in every future affiliate sweep.
};

/**
 * Pure link builder. Throws on unknown ids and on missing payout
 * identifiers — never emit a revenue-less link.
 */
export function buildLinkForConfig(
    config: PartnerConfig,
    slot: AffiliateLinkSlot,
): string {
    if (!config.refCode) {
        throw new Error(
            `[affiliates] partner "${config.id}" has no payout identifier — refusing to build a revenue-less link. Get accepted first, then set refCode.`,
        );
    }
    const base =
        slot.placement === 'affiliate_toast' ? config.signupUrl : config.homeUrl;
    const url = new URL(base);
    if (config.refParam) {
        url.searchParams.set(config.refParam, config.refCode);
    }
    url.searchParams.set('utm_source', UTM_SOURCE);
    url.searchParams.set('utm_medium', slot.placement);
    if (slot.campaign) {
        url.searchParams.set('utm_campaign', slot.campaign);
    }
    if (slot.platform) {
        url.searchParams.set('utm_content', slot.platform);
    }
    if (config.subSourceParam && slot.platform) {
        url.searchParams.set(
            config.subSourceParam,
            `${UTM_SOURCE}-${slot.placement}-${slot.platform}`,
        );
    }
    return url.toString();
}

export function buildAffiliateLink(
    partnerId: PartnerId,
    slot: AffiliateLinkSlot,
): string {
    const config = PARTNERS[partnerId];
    if (!config) {
        throw new Error(
            `[affiliates] unknown affiliate partner "${partnerId}" — refusing to guess a destination.`,
        );
    }
    return buildLinkForConfig(config, slot);
}
