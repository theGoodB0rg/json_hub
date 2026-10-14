/**
 * Tests for the canonical sample/automation detector.
 *
 * The worker keeps a server-side mirror of AUTOMATED_UA_SUBSTRINGS
 * (worker/telemetry-worker.ts); worker/telemetry-worker.test.ts asserts the
 * two stay in agreement over the shared corpus below.
 */
import {
    AUTOMATED_UA_SUBSTRINGS,
    isAutomatedUserAgent,
    isAutomatedEnvironment,
    resolveSampleFlag,
} from './sample-detection';
import { isAutomationUserAgent } from '../../worker/telemetry-worker';

export const AUTOMATION_UA_CORPUS = [
    // The Oct 2026 QA probe signature that poisoned satisfaction at 0%.
    'Mozilla/5.0 (win32) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/20.0.3',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Playwright/1.40',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/13.0.0 Chrome/120 Safari/537.36',
    'test-client',
];

export const GENUINE_UA_CORPUS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Mobile Safari/537.36',
];

describe('sample-detection', () => {
    it('flags every automation UA in the corpus', () => {
        for (const ua of AUTOMATION_UA_CORPUS) {
            expect(isAutomatedUserAgent(ua)).toBe(true);
        }
    });

    it('leaves genuine browser UAs alone', () => {
        for (const ua of GENUINE_UA_CORPUS) {
            expect(isAutomatedUserAgent(ua)).toBe(false);
        }
    });

    it('rejects empty, missing, and non-string UAs without throwing', () => {
        expect(isAutomatedUserAgent('')).toBe(false);
        expect(isAutomatedUserAgent(undefined)).toBe(false);
        expect(isAutomatedUserAgent(null)).toBe(false);
        expect(isAutomatedUserAgent(42)).toBe(false);
    });

    it('treats an explicit webdriver flag as automation even with a clean UA', () => {
        expect(
            isAutomatedEnvironment({ userAgent: GENUINE_UA_CORPUS[0], webdriver: true })
        ).toBe(true);
        expect(
            isAutomatedEnvironment({ userAgent: GENUINE_UA_CORPUS[0], webdriver: false })
        ).toBe(false);
    });

    it('prefers the store demo flag, then automation, then genuine', () => {
        expect(resolveSampleFlag({ storeIsSample: true, userAgent: GENUINE_UA_CORPUS[0] }))
            .toEqual({ isSample: true, reason: 'demo-sample' });
        expect(resolveSampleFlag({ storeIsSample: false, userAgent: AUTOMATION_UA_CORPUS[0] }))
            .toEqual({ isSample: true, reason: 'automated-env' });
        expect(resolveSampleFlag({ storeIsSample: false, userAgent: GENUINE_UA_CORPUS[0] }))
            .toEqual({ isSample: false, reason: 'genuine' });
    });

    it('a harness that forgets the store flag is still quarantined', () => {
        // This is the exact Oct 2026 failure: store flag false/undefined from
        // a jsdom probe must not read as genuine.
        expect(resolveSampleFlag({ userAgent: AUTOMATION_UA_CORPUS[0] }))
            .toEqual({ isSample: true, reason: 'automated-env' });
    });

    it('stays in agreement with the worker-side mirror', () => {
        for (const ua of [...AUTOMATION_UA_CORPUS, ...GENUINE_UA_CORPUS]) {
            expect(isAutomationUserAgent(ua)).toBe(isAutomatedUserAgent(ua));
        }
        expect(AUTOMATED_UA_SUBSTRINGS.length).toBeGreaterThan(0);
    });
});
