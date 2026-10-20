/**
 * Monetization funnel aggregation.
 *
 * Pure: it takes telemetry rows and returns counts, with no file or network
 * access, so it lives here rather than in scripts/ — which jest excludes —
 * and the report imports it. The counting rules are the fiddly part and the
 * part that was wrong before, so they are the part that needs tests.
 */

/** The subset of the D1 `events` row this module reads. */
export interface MonetizationEvent {
    event_name: string;
    format?: string | null;
    error_type?: string | null;
    path?: string | null;
    timestamp: number;
    is_sample?: unknown;
}

/** Epoch at which every Gumroad link started firing `checkout_clicked`. */
const CHECKOUT_EVENT_EPOCH = Date.parse('2026-10-15T00:00:00Z');

/** Purchase intent, from first sight of Pro to a click on a Gumroad link.
 *  Sales themselves live in Gumroad — telemetry only sees the click. */
export interface MonetizationFunnel {
    /** Client page_view beacons on /desktop (the Pro landing page). */
    desktopPageViews: number;
    upsellShown: number;
    upsellDismissed: number;
    /** `checkout_clicked` events, keyed by the link's source (sent as `format`). */
    checkoutClicks: Record<string, number>;
    totalCheckoutClicks: number;
    /** Post-export upsell clicks logged before `checkout_clicked` existed. */
    legacyUpsellClicks: number;
    desktopDownloads: number;
    /** License-key submissions, whatever the outcome. */
    activationAttempts: number;
    /** Keys the worker accepted. The closest thing to a confirmed sale that
     *  telemetry can see — a sale itself is only in Gumroad. */
    activationSucceeded: number;
    /** Keys it rejected. A paying customer in here is an incident. */
    activationFailed: number;
    /** Failure counts by reason code (see lib/telemetry/license-events). */
    activationFailureReasons: Record<string, number>;
}

/** `upsell_clicked` carried three meanings, told apart only by path because
 *  D1 drops the `upsell_type` payload field. Desktop downloads and activation
 *  submits now have their own event names, so each total is the new event
 *  plus the legacy rows that predate the split. Nothing double-counts: once
 *  the new names shipped, `upsell_clicked` stopped firing on those paths. */
export function computeMonetization(events: MonetizationEvent[]): MonetizationFunnel {
    const real = events.filter(e => !(e.is_sample === 1 || e.is_sample === true || e.is_sample === 'true'));
    const upsellClicks = real.filter(e => e.event_name === 'upsell_clicked');
    const activationFailures = real.filter(e => e.event_name === 'license_activation_failed');
    const checkoutClicks: Record<string, number> = {};
    for (const e of real) {
        if (e.event_name !== 'checkout_clicked') continue;
        const source = e.format || 'unknown';
        checkoutClicks[source] = (checkoutClicks[source] || 0) + 1;
    }
    return {
        desktopPageViews: real.filter(e => e.event_name === 'page_view' && e.path === '/desktop').length,
        upsellShown: real.filter(e => e.event_name === 'upsell_shown').length,
        upsellDismissed: real.filter(e => e.event_name === 'upsell_dismissed').length,
        checkoutClicks,
        totalCheckoutClicks: Object.values(checkoutClicks).reduce((a, b) => a + b, 0),
        // Post-export upsell now also fires checkout_clicked, so only rows from
        // before that change count here.
        legacyUpsellClicks: upsellClicks.filter(e => e.path !== '/desktop' && e.path !== '/activate' && e.timestamp < CHECKOUT_EVENT_EPOCH).length,
        desktopDownloads:
            real.filter(e => e.event_name === 'desktop_download_clicked').length +
            upsellClicks.filter(e => e.path === '/desktop').length,
        activationAttempts:
            real.filter(e => e.event_name === 'license_activation_started').length +
            upsellClicks.filter(e => e.path === '/activate').length,
        activationSucceeded: real.filter(e => e.event_name === 'license_activated').length,
        activationFailed: activationFailures.length,
        activationFailureReasons: activationFailures.reduce<Record<string, number>>((acc, e) => {
            const reason = e.error_type || 'unknown';
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {}),
    };
}

