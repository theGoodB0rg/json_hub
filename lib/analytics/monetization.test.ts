import { computeMonetization } from './monetization';

const base = { id: 'x', platform: null, format: null, path: '/', timestamp: 1, is_sample: 0 };
const ev = (over: Record<string, unknown>) => ({ ...base, ...over }) as never;

describe('computeMonetization', () => {
    it('counts legacy upsell_clicked rows and new named events together', () => {
        // Rows written before the event split, told apart only by path.
        const legacy = [
            ev({ event_name: 'upsell_clicked', path: '/desktop' }),
            ev({ event_name: 'upsell_clicked', path: '/activate' }),
            ev({ event_name: 'upsell_clicked', path: '/activate' }),
        ];
        const current = [
            ev({ event_name: 'desktop_download_clicked', path: '/desktop' }),
            ev({ event_name: 'license_activation_started', path: '/activate' }),
        ];

        const m = computeMonetization([...legacy, ...current]);
        expect(m.desktopDownloads).toBe(2);
        expect(m.activationAttempts).toBe(3);
    });

    it('does not double-count a new event as a legacy one', () => {
        const m = computeMonetization([
            ev({ event_name: 'desktop_download_clicked', path: '/desktop' }),
            ev({ event_name: 'license_activation_started', path: '/activate' }),
        ]);
        expect(m.desktopDownloads).toBe(1);
        expect(m.activationAttempts).toBe(1);
    });

    it('splits activation outcomes and groups failures by reason', () => {
        const m = computeMonetization([
            ev({ event_name: 'license_activation_started', path: '/activate' }),
            ev({ event_name: 'license_activation_started', path: '/activate' }),
            ev({ event_name: 'license_activation_started', path: '/activate' }),
            ev({ event_name: 'license_activated', path: '/activate' }),
            ev({ event_name: 'license_activation_failed', path: '/activate', error_type: 'invalid_license' }),
            ev({ event_name: 'license_activation_failed', path: '/activate', error_type: 'server_error' }),
        ]);

        expect(m.activationAttempts).toBe(3);
        expect(m.activationSucceeded).toBe(1);
        expect(m.activationFailed).toBe(2);
        expect(m.activationFailureReasons).toEqual({ invalid_license: 1, server_error: 1 });
    });

    it('buckets a failure with no reason as unknown rather than dropping it', () => {
        const m = computeMonetization([
            ev({ event_name: 'license_activation_failed', path: '/activate', error_type: null }),
        ]);
        expect(m.activationFailed).toBe(1);
        expect(m.activationFailureReasons).toEqual({ unknown: 1 });
    });

    it('excludes our own test traffic from every monetization number', () => {
        const m = computeMonetization([
            ev({ event_name: 'desktop_download_clicked', path: '/desktop', is_sample: 1 }),
            ev({ event_name: 'license_activated', path: '/activate', is_sample: 1 }),
            ev({ event_name: 'checkout_clicked', path: '/activate', format: 'activate_page', is_sample: 1 }),
        ]);
        expect(m.desktopDownloads).toBe(0);
        expect(m.activationSucceeded).toBe(0);
        expect(m.totalCheckoutClicks).toBe(0);
    });

    it('still keys buy-button clicks by source', () => {
        const m = computeMonetization([
            ev({ event_name: 'checkout_clicked', format: 'activate_page' }),
            ev({ event_name: 'checkout_clicked', format: 'activate_page' }),
            ev({ event_name: 'checkout_clicked', format: 'desktop_hero' }),
        ]);
        expect(m.totalCheckoutClicks).toBe(3);
        expect(m.checkoutClicks).toEqual({ activate_page: 2, desktop_hero: 1 });
    });
});
