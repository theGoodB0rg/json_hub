import { getVisitorId, hasOptedOut } from './client-id';

const KEY = 'jsonexport:analytics:client';
const nav = navigator as Navigator & { globalPrivacyControl?: boolean };

describe('getVisitorId', () => {
    beforeEach(() => {
        localStorage.clear();
        Object.defineProperty(nav, 'globalPrivacyControl', { value: undefined, configurable: true });
        Object.defineProperty(nav, 'doNotTrack', { value: null, configurable: true });
    });

    it('creates one random id and keeps returning it', () => {
        const id = getVisitorId();
        expect(id).toMatch(/^[A-Za-z0-9-]{8,64}$/);
        expect(getVisitorId()).toBe(id);
    });

    it('sends nothing when the browser opts out (GPC or DNT)', () => {
        Object.defineProperty(nav, 'globalPrivacyControl', { value: true, configurable: true });
        expect(hasOptedOut()).toBe(true);
        expect(getVisitorId()).toBeNull();
        Object.defineProperty(nav, 'globalPrivacyControl', { value: undefined, configurable: true });
        Object.defineProperty(nav, 'doNotTrack', { value: '1', configurable: true });
        expect(getVisitorId()).toBeNull();
    });

    it('replaces an id older than ~13 months', () => {
        const old = Date.now() - 400 * 24 * 60 * 60 * 1000;
        localStorage.setItem(KEY, JSON.stringify({ clientId: 'old-id-123', firstVisit: old, lastVisit: old, visitCount: 3, sessionCount: 2 }));
        const id = getVisitorId();
        expect(id).not.toBe('old-id-123');
        expect(getVisitorId()).toBe(id);
    });
});
