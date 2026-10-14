/**
 * Tests for fail-closed endpoint resolution.
 *
 * Oct 2026: hardcoded production defaults meant every clone phoned prod
 * telemetry — and the jest suite itself live-fired feedback via the unmocked
 * XHR fallback. Endpoints now resolve to null unless explicitly configured;
 * these tests pin that contract. Note next/jest loads .env.local, so env is
 * scrubbed per-test for determinism.
 */
import {
    resolveEndpoints,
    isTelemetryConfigured,
    ingestFallbackChain,
    feedbackFallbackChain,
    batchFallbackChain,
} from './endpoints';

const ENV_KEY = 'NEXT_PUBLIC_TELEMETRY_URL';
const PROD = 'https://jsonexport-telemetry.idowue93.workers.dev';
let savedEnv: string | undefined;

beforeEach(() => {
    savedEnv = process.env[ENV_KEY];
    delete process.env[ENV_KEY];
});

afterEach(() => {
    if (savedEnv === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = savedEnv;
});

describe('endpoint resolution', () => {
    it('resolves nothing when neither origin nor env is configured (fail-closed)', () => {
        const set = resolveEndpoints('');
        expect(set).toEqual({
            firstPartyIngest: null,
            firstPartyBatch: null,
            firstPartyFeedback: null,
            legacyIngest: null,
            legacyBatch: null,
            legacyFeedback: null,
        });
        expect(isTelemetryConfigured(set)).toBe(false);
        expect(ingestFallbackChain(set)).toEqual([]);
        expect(feedbackFallbackChain(set)).toEqual([]);
        expect(batchFallbackChain(set)).toEqual([]);
    });

    it('resolves same-origin first-party endpoints when an origin is known', () => {
        const set = resolveEndpoints('https://jsonexport.com');
        expect(set.firstPartyIngest).toBe('https://jsonexport.com/_i/i/i');
        expect(set.firstPartyFeedback).toBe('https://jsonexport.com/_i/i/f');
        expect(set.legacyIngest).toBeNull();
        expect(isTelemetryConfigured(set)).toBe(true);
        expect(ingestFallbackChain(set)).toEqual(['https://jsonexport.com/_i/i/i']);
    });

    it('resolves legacy endpoints only when the build env provides the URL', () => {
        process.env[ENV_KEY] = PROD;
        const set = resolveEndpoints('');
        expect(set.firstPartyIngest).toBeNull();
        expect(set.legacyIngest).toBe(`${PROD}/api/telemetry`);
        expect(set.legacyFeedback).toBe(`${PROD}/api/feedback`);
        expect(isTelemetryConfigured(set)).toBe(true);
    });

    it('orders first-party before legacy when both are configured', () => {
        process.env[ENV_KEY] = PROD;
        const set = resolveEndpoints('https://jsonexport.com');
        expect(feedbackFallbackChain(set)).toEqual([
            'https://jsonexport.com/_i/i/f',
            `${PROD}/api/feedback`,
        ]);
    });

    it('never embeds a production URL as a code default', () => {
        // Regression: the old LEGACY_URL default pointed every clone at prod.
        const set = resolveEndpoints('');
        expect(JSON.stringify(set)).not.toContain('workers.dev');
    });
});
