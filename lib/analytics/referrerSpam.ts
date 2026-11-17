/**
 * Referrer-spam domains: bots that run our JS and send page_view beacons with
 * a fake referrer. They are excluded from analytics, never from the site.
 *
 * aocr.org (Oct 27 – Nov 8, 2026): 412 page views, one Chrome/Windows UA,
 * spread evenly over blog posts in four bursts, zero parses — 15% of all
 * client page views, enough to make the converter funnel look half as good.
 */
export const REFERRER_SPAM_DOMAINS = ['aocr.org'] as const;

export function isReferrerSpam(referrer: string | null | undefined): boolean {
    if (!referrer) return false;
    let host: string;
    try {
        host = new URL(referrer).hostname.toLowerCase();
    } catch {
        return false;
    }
    return REFERRER_SPAM_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}
