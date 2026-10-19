/**
 * Tests for fail-closed endpoint resolution.
 *
 * Oct 2026: hardcoded production defaults meant every clone phoned prod
 * telemetry — and the jest suite itself live-fired feedback via the unmocked
 * XHR fallback. Endpoints resolved to null unless explicitly configured;
 * these tests pin that contract.
 *
 * Late Oct 2026 tightening: the telemetry bundle no longer knows ANY
 * absolute URL. The Oct 18 curl flood proved that once a raw ingest URL
 * ships in a bundle, scanners find it and hammer it. The client now
 * integrates over the same-origin `/_i/<token>/...` path only, and the
 * build token itself is fail-closed: unset means no-op, never a
 * predictable placeholder. These tests pin the narrower contract.
 */
import {
    resolveEndpoints,
    isTelemetryConfigured,
    ingestFallbackChain,
    feedbackFallbackChain,
    batchFallbackChain,
    _setBuildToken,
} from './endpoints';

const PROD = 'https://jsonexport-telemetry.idowue93.workers.dev';

describe('endpoint resolution', () => {
    beforeEach(() => {
        // next/jest loads .env.local which may seed the token; scrub it so
        // the fail-closed path is exercised deterministically.
        _setBuildToken('');
    });

    afterEach(() => {
        _setBuildToken('');
    });

    it('resolves nothing when the build token is unset (fail-closed)', () => {
        const set = resolveEndpoints('https://jsonexport.com');
        expect(set).toEqual({
            firstPartyIngest: null,
            firstPartyBatch: null,
            firstPartyFeedback: null,
        });
        expect(isTelemetryConfigured(set)).toBe(false);
        expect(ingestFallbackChain(set)).toEqual([]);
        expect(feedbackFallbackChain(set)).toEqual([]);
        expect(batchFallbackChain(set)).toEqual([]);
    });

    it('does NOT fall back to a placeholder token', () => {
        // Regression: an earlier revision defaulted to 'i', which shipped a
        // guessable ingest path into any build that forgot the secret.
        const set = resolveEndpoints('https://jsonexport.com');
        expect(JSON.stringify(set)).not.toContain('/_i/i/');
    });

    it('resolves same-origin first-party endpoints around the build token', () => {
        _setBuildToken('tok-123');
        const set = resolveEndpoints('https://jsonexport.com');
        expect(set.firstPartyIngest).toBe('https://jsonexport.com/_i/tok-123/i');
        expect(set.firstPartyBatch).toBe('https://jsonexport.com/_i/tok-123/b');
        expect(set.firstPartyFeedback).toBe('https://jsonexport.com/_i/tok-123/f');
        expect(isTelemetryConfigured(set)).toBe(true);
        expect(ingestFallbackChain(set)).toEqual(['https://jsonexport.com/_i/tok-123/i']);
        expect(batchFallbackChain(set)).toEqual(['https://jsonexport.com/_i/tok-123/b']);
        expect(feedbackFallbackChain(set)).toEqual(['https://jsonexport.com/_i/tok-123/f']);
    });

    it('resolves nothing without a known origin even when the token is set (SSR/tests)', () => {
        _setBuildToken('tok-123');
        const set = resolveEndpoints('');
        expect(set.firstPartyIngest).toBeNull();
        expect(isTelemetryConfigured(set)).toBe(false);
    });

    it('the token never reaches the URL unencoded', () => {
        _setBuildToken('a/b c');
        const set = resolveEndpoints('https://jsonexport.com');
        expect(set.firstPartyIngest).toBe('https://jsonexport.com/_i/a%2Fb%20c/i');
    });

    it('never embeds a telemetry worker URL in the client contract', () => {
        // The Oct 18 flood vector: a bundle-visible URL to POST at directly.
        _setBuildToken('tok-123');
        const set = resolveEndpoints('https://jsonexport.com');
        expect(JSON.stringify(set)).not.toContain('workers.dev');
        expect(JSON.stringify(set)).not.toContain(PROD);
        expect(JSON.stringify(set)).not.toContain('api/telemetry');
        expect(JSON.stringify(set)).not.toContain('api/feedback');
    });
});
