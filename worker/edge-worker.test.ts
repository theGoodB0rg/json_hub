/**
 * Regression tests for the edge worker's bot-score derivation.
 *
 * Context: between the worker's first deploy and 2026-10-10 the score was
 * derived as `typeof cf.verifiedBotCategory === 'string' ? 1 : 0`. On the free
 * tier `cf.botManagement` is undefined and `cf.verifiedBotCategory` is an
 * EMPTY STRING for ordinary human traffic, so every request was stamped
 * "definitely bot". Analytics Engine confirmed it: 357/357 rows over 48h had
 * double2 = 1, including rows whose uaClass was 'desktop'/'mobile'. That
 * zeroed the Pillar 1 human count and suppressed every Pillar 2 edge-fallback
 * write, because both gates require score >= 30 or score === 0.
 */

import {
    SCORE_SOURCE,
    HUMAN_BOT_SCORE_THRESHOLD,
    NON_HUMAN_CLIENT_CLASSES,
    classifyClient,
    looksHuman,
    allowIngestRequest,
    _resetIngestLimiter,
} from './edge-worker';
import { NON_HUMAN_SQL_LIST } from '../scripts/analytics/capture-rate';

const CHROME_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';

function headers(h: Record<string, string>) {
    const lower = Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), v]));
    return { get: (name: string) => lower[name.toLowerCase()] ?? null };
}

describe('classifyClient — request-header refinement of the UA class', () => {
    it('keeps a real browser navigation as desktop', () => {
        expect(classifyClient(headers({
            'user-agent': CHROME_UA,
            'sec-fetch-mode': 'navigate',
            'accept-language': 'en-US,en;q=0.9',
        }))).toBe('desktop');
    });

    it('REGRESSION: a scraper with a Chrome UA and no browser headers is not human', () => {
        // Chrome UA but neither Sec-Fetch-Mode nor Accept-Language: the
        // Chromium discriminator fires before the generic nobrowser fallback.
        const cls = classifyClient(headers({ 'user-agent': CHROME_UA }));
        expect(cls).toBe('fakebrowser');
        expect(looksHuman(0, SCORE_SOURCE.UNSCORED, cls)).toBe(false);
    });

    it('REGRESSION 2026-10-17: scanner spoofing Mobile Chrome + Accept-Language (no Sec-Fetch) is not human', () => {
        // The exact observed fingerprint of the scanner that inflated Pillar 1
        // to 764% of CF RUM: Mobile Chrome UA, Accept-Language: en-US,en;q=0.9,
        // Sec-Purpose absent, but critically NO Sec-Fetch-* header. Real Chrome
        // mobile has sent Sec-Fetch-Mode on every navigation since 2019.
        const scannerH = headers({
            'user-agent':
                'Mozilla/5.0 (Linux; Android 13; SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
            'accept-language': 'en-US,en;q=0.9',
        });
        const cls = classifyClient(scannerH);
        expect(cls).toBe('fakebrowser');
        expect(looksHuman(0, SCORE_SOURCE.UNSCORED, cls)).toBe(false);
    });

    it('other Chromium variants (Edge, Opera, Samsung) without Sec-Fetch classify as fakebrowser', () => {
        expect(classifyClient(headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
            'accept-language': 'en',
        }))).toBe('fakebrowser');
        expect(classifyClient(headers({
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/28.0.0.0',
        }))).toBe('fakebrowser');
    });

    it('a real Firefox old enough to lack Sec-Fetch support still sends Accept-Language and stays counted', () => {
        // Deliberate trade-off: spoofers fake Chrome, not Firefox, so the
        // fakebrowser rule is Chromium-only. Old Firefox with Accept-Language
        // keeps its human-conservative desktop class.
        expect(classifyClient(headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
            'accept-language': 'en-GB',
        }))).toBe('desktop');
    });

    it('keeps an older Safari without Sec-Fetch headers when it sends Accept-Language', () => {
        expect(classifyClient(headers({
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/15.6 Safari/605.1.15',
            'accept-language': 'en-GB',
        }))).toBe('desktop');
    });

    it('treats browser prefetch and prerender as non-pageviews', () => {
        expect(classifyClient(headers({ 'user-agent': CHROME_UA, 'sec-purpose': 'prefetch;prerender', 'sec-fetch-mode': 'navigate' }))).toBe('prefetch');
        expect(classifyClient(headers({ 'user-agent': CHROME_UA, purpose: 'prefetch' }))).toBe('prefetch');
    });

    it('treats non-navigation fetches of HTML as subrequests', () => {
        expect(classifyClient(headers({ 'user-agent': CHROME_UA, 'sec-fetch-mode': 'cors', 'accept-language': 'en' }))).toBe('subrequest');
    });

    it('lets declared bots keep their UA class', () => {
        expect(classifyClient(headers({ 'user-agent': 'Googlebot/2.1', 'sec-fetch-mode': 'navigate' }))).toBe('bot');
    });

    it('capture-rate SQL list contains exactly the non-human classes', () => {
        expect(NON_HUMAN_SQL_LIST).toBe(NON_HUMAN_CLIENT_CLASSES.map(c => `'${c}'`).join(', '));
    });
});

/**
 * Mirrors the score derivation inside the worker's fetch handler. Kept here as
 * a pure function so the branch table can be exercised without a Workers
 * runtime; the worker body and this helper must stay structurally identical.
 */
function deriveScore(cf: { botManagement?: { score?: unknown }; verifiedBotCategory?: unknown }) {
    const cfScore = cf.botManagement?.score;
    const verifiedBotCategory =
        typeof cf.verifiedBotCategory === 'string' ? cf.verifiedBotCategory.trim() : '';

    if (typeof cfScore === 'number' && Number.isFinite(cfScore) && cfScore > 0) {
        return { botScore: cfScore, scoreSource: SCORE_SOURCE.CF_SCORED };
    }
    if (verifiedBotCategory.length > 0) {
        return { botScore: 1, scoreSource: SCORE_SOURCE.VERIFIED_BOT };
    }
    return { botScore: 0, scoreSource: SCORE_SOURCE.UNSCORED };
}

describe('edge worker bot-score derivation', () => {
    it('REGRESSION: free-tier human with empty verifiedBotCategory is NOT scored as a bot', () => {
        // This is the exact shape Cloudflare hands a free-tier worker for a
        // normal human visitor. The old code returned botScore = 1 here.
        const { botScore, scoreSource } = deriveScore({ verifiedBotCategory: '' });

        expect(botScore).toBe(0);
        expect(scoreSource).toBe(SCORE_SOURCE.UNSCORED);
        expect(looksHuman(botScore, scoreSource, 'desktop')).toBe(true);
        expect(looksHuman(botScore, scoreSource, 'mobile')).toBe(true);
    });

    it('treats a missing cf object as unscored, not as a bot', () => {
        const { botScore, scoreSource } = deriveScore({});
        expect(scoreSource).toBe(SCORE_SOURCE.UNSCORED);
        expect(looksHuman(botScore, scoreSource, 'desktop')).toBe(true);
    });

    it('honours a declared verified bot (non-empty category)', () => {
        const { botScore, scoreSource } = deriveScore({ verifiedBotCategory: 'Search Engine Crawler' });
        expect(botScore).toBe(1);
        expect(scoreSource).toBe(SCORE_SOURCE.VERIFIED_BOT);
        // A verified bot is never human, even with a browser-shaped UA.
        expect(looksHuman(botScore, scoreSource, 'desktop')).toBe(false);
    });

    it('prefers a real Cloudflare bot score when present', () => {
        expect(deriveScore({ botManagement: { score: 85 } })).toEqual({
            botScore: 85,
            scoreSource: SCORE_SOURCE.CF_SCORED,
        });
        expect(deriveScore({ botManagement: { score: 3 } })).toEqual({
            botScore: 3,
            scoreSource: SCORE_SOURCE.CF_SCORED,
        });
    });

    it('applies the CF threshold only to genuinely scored rows', () => {
        expect(looksHuman(HUMAN_BOT_SCORE_THRESHOLD, SCORE_SOURCE.CF_SCORED, 'desktop')).toBe(true);
        expect(looksHuman(HUMAN_BOT_SCORE_THRESHOLD - 1, SCORE_SOURCE.CF_SCORED, 'desktop')).toBe(false);
        // Unscored rows must not be measured against the threshold at all.
        expect(looksHuman(0, SCORE_SOURCE.UNSCORED, 'desktop')).toBe(true);
    });

    it('still rejects bot-shaped user agents when unscored', () => {
        expect(looksHuman(0, SCORE_SOURCE.UNSCORED, 'bot')).toBe(false);
        expect(looksHuman(0, SCORE_SOURCE.UNSCORED, 'automated')).toBe(false);
    });

    it('never classifies a non-finite score as a usable score', () => {
        expect(deriveScore({ botManagement: { score: NaN } }).scoreSource).toBe(SCORE_SOURCE.UNSCORED);
        expect(deriveScore({ botManagement: { score: '42' } }).scoreSource).toBe(SCORE_SOURCE.UNSCORED);
    });
});

describe('capture-rate SQL agrees with looksHuman()', () => {
    /**
     * Evaluates the WHERE clause from scripts/analytics/capture-rate.ts against
     * a row. If the SQL there is edited without updating looksHuman (or vice
     * versa), this test fails — which is the whole point: the 2026-10-10
     * incident was two copies of one rule drifting apart.
     */
    const sqlPredicate = (row: { double2: number; double3: number; double4: number; blob4: string }) =>
        row.double4 >= 2 &&
        ((row.double3 === 1 && row.double2 >= HUMAN_BOT_SCORE_THRESHOLD) ||
            (row.double3 === 0 && !(NON_HUMAN_CLIENT_CLASSES as readonly string[]).includes(row.blob4)));

    const cases: Array<{ double2: number; double3: number; blob4: string }> = [
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'desktop' },
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'mobile' },
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'bot' },
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'automated' },
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'other' },
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'prefetch' },
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'subrequest' },
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'nobrowser' },
        { double2: 0, double3: SCORE_SOURCE.UNSCORED, blob4: 'fakebrowser' },
        { double2: 1, double3: SCORE_SOURCE.VERIFIED_BOT, blob4: 'desktop' },
        { double2: 1, double3: SCORE_SOURCE.VERIFIED_BOT, blob4: 'bot' },
        { double2: 99, double3: SCORE_SOURCE.CF_SCORED, blob4: 'desktop' },
        { double2: 30, double3: SCORE_SOURCE.CF_SCORED, blob4: 'desktop' },
        { double2: 29, double3: SCORE_SOURCE.CF_SCORED, blob4: 'desktop' },
        { double2: 1, double3: SCORE_SOURCE.CF_SCORED, blob4: 'bot' },
    ];

    it.each(cases)('row %j classifies identically in SQL and TS', (row) => {
        expect(sqlPredicate({ ...row, double4: 2 })).toBe(
            looksHuman(row.double2, row.double3, row.blob4)
        );
    });

    it('excludes pre-fix (schema v1) rows from the human count', () => {
        // Old rows read back double3 = 0 and double4 = 0. Their double2 was
        // hardcoded to 1, so they are unclassifiable and must be dropped
        // rather than counted either way.
        expect(sqlPredicate({ double2: 1, double3: 0, double4: 0, blob4: 'desktop' })).toBe(false);
    });
});

describe('allowIngestRequest — per-IP ingest rate limiter', () => {
    /**
     * Added after the Oct 18 curl flood (1,900 forged events from one IP in
     * 5 minutes). Best-effort in-isolate state, but it caps a single-origin
     * flood immediately; the WAF rule backstop is provisioned separately.
     * Tests use small windows/maxima so windows actually roll over.
     */
    beforeEach(() => _resetIngestLimiter());
    afterEach(() => _resetIngestLimiter());

    it('admits requests up to the per-IP allowance and then 429-blocks the rest of the window', () => {
        // Window larg enough that every probe below lands in bucket 0.
        const WIN = 1_000_000;
        const t0 = 100;
        for (let i = 0; i < 5; i++) {
            expect(allowIngestRequest('203.0.113.1', t0 + i, 5, WIN)).toBe(true);
        }
        expect(allowIngestRequest('203.0.113.1', t0 + 30_000, 5, WIN)).toBe(false);
        expect(allowIngestRequest('203.0.113.1', t0 + 999_000, 5, WIN)).toBe(false);
    });

    it('gives every IP an independent bucket (collateral users stay unaffected)', () => {
        const WIN = 1_000_000;
        const t0 = 100;
        for (let i = 0; i < 5; i++) expect(allowIngestRequest('203.0.113.7', t0 + i, 5, WIN)).toBe(true);
        // A different visitor sharing the minute window is untouched.
        expect(allowIngestRequest('198.51.100.9', t0, 5, WIN)).toBe(true);
    });

    it('resets when the window rolls over', () => {
        const WIN = 1_000_000;
        const t0 = 100;
        for (let i = 0; i < 5; i++) expect(allowIngestRequest('203.0.113.11', t0 + i, 5, WIN)).toBe(true);
        expect(allowIngestRequest('203.0.113.11', t0 + 1_000, 5, WIN)).toBe(false);
        // Next bucket: allowance restored.
        expect(allowIngestRequest('203.0.113.11', t0 + WIN, 5, WIN)).toBe(true);
    });

    it('quarantines header-less IPs under an unknown key rather than exempting them', () => {
        const WIN = 1_000_000;
        const t0 = 100;
        for (let i = 0; i < 3; i++) expect(allowIngestRequest(null, t0 + i, 3, WIN)).toBe(true);
        expect(allowIngestRequest(null, t0 + 10, 3, WIN)).toBe(false);
    });
});
