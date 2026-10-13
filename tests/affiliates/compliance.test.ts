import { AFFILIATE_PARTNERS } from '@/lib/affiliates';
import { AFFILIATE_OFFERS } from '@/lib/growth/affiliate-offers';
import { PARTNERS } from '@/lib/affiliates-core';

/**
 * Config compliance: sidebar + toast surfaces must never ship a
 * revenue-less outbound link. If a partner is added to the registry it must
 * be approved (non-empty payout identifier) AND surfaced with that
 * identifier in the URL.
 */
describe('Affiliate config compliance', () => {
    it('sidebar lists only approved registry partners', () => {
        expect(AFFILIATE_PARTNERS.length).toBeGreaterThan(0);
        for (const partner of AFFILIATE_PARTNERS) {
            const def = (PARTNERS as Record<string, { refCode: string; refParam: string }>)[
                partner.id
            ];
            expect(def).toBeDefined();
            expect(def.refCode.length).toBeGreaterThan(0);
            expect(partner.affiliateUrl).toContain(`${def.refParam}=${def.refCode}`);
            expect(partner.affiliateUrl).toContain('utm_source=jsonexport');
            expect(partner.affiliateUrl).toContain('utm_medium=affiliate_sidebar');
        }
    });

    it('no toast or sidebar URL is a bare homepage without tracking', () => {
        const urls = [
            ...AFFILIATE_PARTNERS.map((p) => p.affiliateUrl),
            ...Object.values(AFFILIATE_OFFERS).map((o) => o.link),
        ];
        for (const url of urls) {
            const parsed = new URL(url);
            // Bare homepages (path === '/' with no query) are free referrals.
            const isBare = parsed.search === '';
            expect(isBare).toBe(false);
        }
    });

    it('sidebar entries carry benefit copy and disclosure-safe fields', () => {
        for (const partner of AFFILIATE_PARTNERS) {
            expect(partner.name.length).toBeGreaterThan(0);
            expect(partner.benefit.length).toBeGreaterThan(0);
            expect(partner.description.length).toBeGreaterThan(0);
            expect(partner.affiliateUrl.startsWith('https://')).toBe(true);
        }
    });
});
