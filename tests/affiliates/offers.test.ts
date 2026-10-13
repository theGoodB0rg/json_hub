import { AFFILIATE_OFFERS } from '@/lib/growth/affiliate-offers';
import { PARTNERS } from '@/lib/affiliates-core';

/**
 * Offer-level guarantees: every toast offer must resolve to a payout-tracked
 * destination, and keys must follow the platform.split('-')[0] convention
 * used by ContextualAffiliateToast.
 */
describe('Affiliate toast offers', () => {
    const payoutMarkers = Object.values(PARTNERS)
        .filter((p) => p.refParam.length > 0 && p.refCode.length > 0)
        .map((p) => `${p.refParam}=${p.refCode}`);
    const identityMarkers = Object.values(PARTNERS)
        .filter((p) => p.refParam.length === 0 && p.refCode.length > 0)
        .map((p) => p.refCode);

    it('routes every offer to a URL carrying a known payout identifier', () => {
        for (const [key, offer] of Object.entries(AFFILIATE_OFFERS)) {
            const hasPayout =
                payoutMarkers.some((marker) => offer.link.includes(marker)) ||
                identityMarkers.some((marker) => offer.link.includes(marker));
            expect(`${key}: ${offer.link} carries a payout identifier`).toBe(
                `${key}: ${offer.link} carries a payout identifier`,
            );
            expect(hasPayout).toBe(true);
        }
    });

    it('covers the top-traffic platform pages (shopify/hubspot/stripe/salesforce/jira/trello)', () => {
        for (const key of ['shopify', 'hubspot', 'stripe', 'salesforce', 'jira', 'trello']) {
            expect(AFFILIATE_OFFERS[key]).toBeDefined();
        }
    });

    it('gives every offer non-empty title, description, and CTA', () => {
        for (const offer of Object.values(AFFILIATE_OFFERS)) {
            expect(offer.title.length).toBeGreaterThan(0);
            expect(offer.description.length).toBeGreaterThan(10);
            expect(offer.cta.length).toBeGreaterThan(0);
            expect(offer.link.startsWith('https://')).toBe(true);
        }
    });

    it('makes platform-specific integration claims only for confirmed connectors', () => {
        // Coupler.io confirms HubSpot and Shopify connectors by name; every
        // other platform must use source-count-agnostic copy.
        const confirmed = new Set(['shopify', 'hubspot']);
        for (const [key, offer] of Object.entries(AFFILIATE_OFFERS)) {
            if (confirmed.has(key)) continue;
            const text = `${offer.title} ${offer.description}`.toLowerCase();
            const namesConnector = /\b(hubspot|shopify|salesforce|jira|stripe|trello)\b.*\b(connector|integration|syncs .* straight)/.test(
                text,
            );
            expect(namesConnector).toBe(false);
        }
    });
});
