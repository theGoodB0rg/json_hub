import {
    PARTNERS,
    buildAffiliateLink,
    buildLinkForConfig,
    type PartnerConfig,
} from '@/lib/affiliates-core';

/**
 * Registry invariants.
 *
 * HARD RULE (see lib/affiliates-core.ts): a partner without a payout
 * identifier must never produce a link. These tests pin that rule so a
 * future "just add the homepage for now" commit fails loudly.
 */
describe('Affiliate registry', () => {
    it('exposes Coupler as an approved partner with a payout identifier', () => {
        expect(PARTNERS.coupler.refCode).toBe('jsonexport');
        expect(PARTNERS.coupler.refParam).toBe('ref');
    });

    it('exposes systeme.io with its dashboard-issued payout identifier', () => {
        expect(PARTNERS.systeme.refParam).toBe('sa');
        expect(PARTNERS.systeme.refCode).toMatch(/^sa[0-9a-f]{40}$/);
        const link = buildAffiliateLink('systeme', { placement: 'affiliate_sidebar' });
        expect(link).toContain(`sa=${PARTNERS.systeme.refCode}`);
        expect(link).toContain('utm_source=jsonexport');
    });

    it('every registered partner carries a non-empty payout identifier', () => {
        for (const partner of Object.values(PARTNERS)) {
            expect(partner.refCode.length).toBeGreaterThan(0);
        }
    });

    it('builds the exact legacy Coupler sidebar URL (cold/ambient placement)', () => {
        expect(buildAffiliateLink('coupler', { placement: 'affiliate_sidebar' })).toBe(
            'https://www.coupler.io/?ref=jsonexport&utm_source=jsonexport&utm_medium=affiliate_sidebar',
        );
    });

    it('builds the exact legacy Coupler toast URL (warm/post-conversion placement)', () => {
        expect(
            buildAffiliateLink('coupler', {
                placement: 'affiliate_toast',
                platform: 'shopify',
                campaign: 'phase4_growth_execution',
            }),
        ).toBe(
            'https://app.coupler.io/register/sign_up?ref=jsonexport&utm_source=jsonexport&utm_medium=affiliate_toast&utm_campaign=phase4_growth_execution&utm_content=shopify',
        );
    });

    it('throws for unknown partner ids instead of emitting a homepage link', () => {
        expect(() =>
            buildAffiliateLink('not-a-partner' as never, { placement: 'affiliate_sidebar' }),
        ).toThrow(/unknown affiliate partner/i);
    });

    it('refuses to build a link when the payout identifier is missing', () => {
        const unapproved: PartnerConfig = {
            ...PARTNERS.coupler,
            id: 'coupler-pending',
            refCode: '',
        };
        expect(() =>
            buildLinkForConfig(unapproved, { placement: 'affiliate_sidebar' }),
        ).toThrow(/no payout identifier/i);
    });

    it('supports Make-style pc= identifiers with per-slot sub-tracking', () => {
        const make: PartnerConfig = {
            id: 'make',
            name: 'Make',
            intent: 'recurring-automation',
            homeUrl: 'https://www.make.com/en',
            signupUrl: 'https://www.make.com/en/register',
            refParam: 'pc',
            refCode: 'TESTCODE',
            subSourceParam: 'affiliateSource',
        };
        const url = new URL(
            buildLinkForConfig(make, { placement: 'affiliate_toast', platform: 'stripe' }),
        );
        expect(url.searchParams.get('pc')).toBe('TESTCODE');
        expect(url.searchParams.get('utm_source')).toBe('jsonexport');
        expect(url.searchParams.get('utm_medium')).toBe('affiliate_toast');
        expect(url.searchParams.get('utm_content')).toBe('stripe');
        expect(url.searchParams.get('affiliateSource')).toContain('stripe');
    });

    it('supports identity-in-URL partners (Google Workspace Referral token link)', () => {
        const google: PartnerConfig = {
            id: 'google-workspace',
            name: 'Google Workspace',
            intent: 'spreadsheet-followon',
            homeUrl: 'https://refer.workspace.google.com/TESTTOKEN',
            signupUrl: 'https://refer.workspace.google.com/TESTTOKEN',
            refParam: '',
            refCode: 'TESTTOKEN',
        };
        const link = buildLinkForConfig(google, { placement: 'affiliate_sidebar' });
        expect(link).toContain('TESTTOKEN');
        expect(link).toContain('utm_source=jsonexport');
    });
});
