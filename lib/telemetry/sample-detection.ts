/**
 * Sample detection — the single canonical definition of "this submission came
 * from automation, not a human using the product".
 *
 * Context: in Oct 2026 our own QA probes ("Missing changelog" Jira checks run
 * from a jsdom harness in NG) were recorded with is_sample = 0 and reported
 * as genuine user dissatisfaction, pinning satisfaction at 0%. The client
 * only flagged demo conversions from the app store; nothing detected the
 * harness. The worker trusted the client flag blindly.
 *
 * Design: two layers, one vocabulary.
 *   1. Client (`sendUserFeedback`) ORs the store demo flag with environment
 *      detection, so a harness that forgets to set isSample is still flagged.
 *   2. Worker (`telemetry-worker.ts`) re-checks the request User-Agent and
 *      forces is_sample = 1 for automation, so forged or missing flags and
 *      direct API posts cannot poison the metric either.
 *
 * The worker keeps its own mirror of the substring list (Workers bundle
 * standalone; importing app code into the bundle is not worth the coupling).
 * `sample-detection.test.ts` asserts the two stay in agreement over a corpus,
 * the same mirror-and-test convention used for the bot-score derivation.
 *
 * Flagged rows are NOT dropped — they are stored with is_sample = 1 and the
 * report renders them under a labelled quarantine section, excluded from the
 * satisfaction rate. Quarantine, don't delete: dropping them would hide QA
 * activity we may want to audit later.
 */

/** Substrings (case-insensitive) that only appear in automation UAs. */
export const AUTOMATED_UA_SUBSTRINGS = [
    'jsdom',
    'happy-dom',
    'headless',
    'playwright',
    'selenium',
    'puppeteer',
    'cypress',
    'phantomjs',
    'test-client',
    'vitest',
] as const;

export type SampleReason = 'demo-sample' | 'automated-env' | 'genuine';

export interface SampleFlag {
    isSample: boolean;
    reason: SampleReason;
}

/** True when the UA belongs to a test harness / headless driver. */
export function isAutomatedUserAgent(ua: unknown): boolean {
    if (typeof ua !== 'string' || ua.length === 0) return false;
    const lower = ua.toLowerCase();
    return AUTOMATED_UA_SUBSTRINGS.some((sub) => lower.includes(sub));
}

/**
 * True when the current JS environment looks automated: webdriver flag set
 * or an automation UA. Safe to call during SSR (no window) — returns false
 * there; the worker performs its own request-UA check server-side.
 */
export function isAutomatedEnvironment(input?: {
    userAgent?: unknown;
    webdriver?: unknown;
}): boolean {
    if (input?.webdriver === true) return true;
    if (typeof input?.userAgent === 'string') {
        return isAutomatedUserAgent(input.userAgent);
    }
    try {
        if (typeof navigator === 'undefined') return false;
        if ((navigator as Navigator & { webdriver?: boolean }).webdriver === true) return true;
        return isAutomatedUserAgent(navigator.userAgent);
    } catch {
        return false;
    }
}

/**
 * Resolve the flag to store/transmit. The store demo flag wins first (it
 * carries intent), automation detection second, genuine last. OR semantics:
 * either signal quarantines the row.
 */
export function resolveSampleFlag(input: {
    storeIsSample?: unknown;
    userAgent?: unknown;
    webdriver?: unknown;
}): SampleFlag {
    if (input.storeIsSample === true) {
        return { isSample: true, reason: 'demo-sample' };
    }
    if (isAutomatedEnvironment({ userAgent: input.userAgent, webdriver: input.webdriver })) {
        return { isSample: true, reason: 'automated-env' };
    }
    return { isSample: false, reason: 'genuine' };
}
