import {
    isChunkLoadError,
    importWithRetry,
    stashForRecovery,
    takeRecoveryStash,
    didReloadForChunks,
} from './chunkRecovery';

describe('isChunkLoadError', () => {
    it.each([
        'Loading chunk 7416 failed. (error: https://jsonexport.com/_next/static/chunks/7416-a1.js)',
        'Loading chunk app/page failed.',
        'Failed to fetch dynamically imported module: https://jsonexport.com/_next/static/chunks/x.js',
        'error loading dynamically imported module',
        'Importing a module script failed.',
    ])('detects %s', (message) => {
        expect(isChunkLoadError(new Error(message))).toBe(true);
    });

    it('detects webpack ChunkLoadError by name even with an odd message', () => {
        const error = new Error('something');
        error.name = 'ChunkLoadError';
        expect(isChunkLoadError(error)).toBe(true);
    });

    it.each([
        'Unexpected token \'a\', "abc" is not valid JSON',
        'Maximum call stack size exceeded',
        'Unsupported format: pdf',
    ])('does not claim %s', (message) => {
        expect(isChunkLoadError(new Error(message))).toBe(false);
    });

    it('is safe on null and non-errors', () => {
        expect(isChunkLoadError(null)).toBe(false);
        expect(isChunkLoadError(undefined)).toBe(false);
        expect(isChunkLoadError('Loading chunk 1 failed.')).toBe(true);
    });
});

describe('importWithRetry', () => {
    it('returns the module on first success without retrying', async () => {
        const load = jest.fn().mockResolvedValue({ ok: 1 });
        await expect(importWithRetry(load)).resolves.toEqual({ ok: 1 });
        expect(load).toHaveBeenCalledTimes(1);
    });

    it('retries a dropped chunk request and succeeds', async () => {
        const load = jest
            .fn()
            .mockRejectedValueOnce(new Error('Loading chunk 7416 failed.'))
            .mockResolvedValue({ ok: 1 });
        await expect(importWithRetry(load, 3, 0)).resolves.toEqual({ ok: 1 });
        expect(load).toHaveBeenCalledTimes(2);
    });

    it('gives up after the attempt budget and rethrows the chunk error', async () => {
        const load = jest.fn().mockRejectedValue(new Error('Loading chunk 7416 failed.'));
        await expect(importWithRetry(load, 3, 0)).rejects.toThrow(/Loading chunk/);
        expect(load).toHaveBeenCalledTimes(3);
    });

    it('does NOT retry a real export bug — it surfaces immediately', async () => {
        const load = jest.fn().mockRejectedValue(new Error('Unsupported format: pdf'));
        await expect(importWithRetry(load, 3, 0)).rejects.toThrow('Unsupported format: pdf');
        expect(load).toHaveBeenCalledTimes(1);
    });
});

describe('recovery stash', () => {
    beforeEach(() => sessionStorage.clear());

    it('round-trips the input and clears itself after one read', () => {
        expect(stashForRecovery('{"a":1}')).toBe(true);
        expect(takeRecoveryStash()).toBe('{"a":1}');
        expect(takeRecoveryStash()).toBeNull();
    });

    it('refuses an input too large to hold, so the caller can warn', () => {
        expect(stashForRecovery('x'.repeat(2_000_001))).toBe(false);
        expect(takeRecoveryStash()).toBeNull();
    });

    it('refuses empty input rather than storing a blank', () => {
        expect(stashForRecovery('')).toBe(false);
    });

    it('survives sessionStorage throwing (private mode)', () => {
        const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        expect(stashForRecovery('{"a":1}')).toBe(false);
        setItem.mockRestore();
    });

    it('reports no reload happened on a clean load', () => {
        expect(didReloadForChunks()).toBe(false);
    });
});
