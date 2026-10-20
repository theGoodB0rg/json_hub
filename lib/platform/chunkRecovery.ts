/**
 * Recovery for failed lazy-chunk loads.
 *
 * The exporters are code-split (`await import(...)` in the store), so the
 * first export of a session fetches a hashed chunk over the network. Two
 * things make that fetch fail in the wild:
 *
 *  1. A flaky mobile connection drops the request. Retrying the same URL
 *     works.
 *  2. The site was redeployed while the tab was open, or the browser is
 *     holding a cached HTML document. Static export gives every build new
 *     chunk hashes and removes the old files, so the chunk the page asks for
 *     is a 404 and will stay a 404. Only fresh HTML fixes it, which means a
 *     reload.
 *
 * Case 2 is what the telemetry caught: one visitor on iOS Safari hit
 * "Loading chunk 7416 failed" three times in 22 seconds on 2026-10-18, came
 * back eight hours later and hit it three more times. Retrying could never
 * have helped them, and a reload would have cost them the JSON they had
 * pasted — the store only persists settings, not input. So we stash the
 * input first and put it back after the reload.
 */

const STASH_KEY = 'json-hub-chunk-stash';
const RELOAD_FLAG = 'json-hub-chunk-reloaded';

/** sessionStorage is ~5MB; well under it leaves room for the rest of the app. */
const MAX_STASH_CHARS = 2_000_000;

const CHUNK_ERROR_PATTERN =
    /loading chunk \S+ failed|chunkloaderror|(failed to fetch|error loading) dynamically imported module|importing a module script failed/i;

export function isChunkLoadError(error: unknown): boolean {
    if (!error) return false;
    if (typeof error === 'object' && (error as { name?: string }).name === 'ChunkLoadError') return true;
    const message = error instanceof Error ? error.message : String(error);
    return CHUNK_ERROR_PATTERN.test(message);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs a dynamic import, retrying only the failure mode a retry can fix.
 *
 * The thunk must contain the literal `import()` call so the bundler can still
 * see it: `importWithRetry(() => import('@/lib/x'))`.
 *
 * Anything that is not a chunk-load error is rethrown untouched — a genuine
 * export bug should surface on the first attempt, not three times slower.
 */
export async function importWithRetry<T>(load: () => Promise<T>, attempts = 3, delayMs = 250): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await load();
        } catch (error) {
            if (!isChunkLoadError(error)) throw error;
            lastError = error;
            if (attempt < attempts - 1) await wait(delayMs * (attempt + 1));
        }
    }
    throw lastError;
}

/** True when this page load is itself the result of a recovery reload. */
export function didReloadForChunks(): boolean {
    try {
        return sessionStorage.getItem(RELOAD_FLAG) === '1';
    } catch {
        return false;
    }
}

/**
 * Keeps the user's input across a recovery reload.
 *
 * Returns false when it could not be saved (private mode, quota, or an input
 * too large to hold) so the caller can warn instead of promising a safe
 * reload it cannot deliver.
 */
export function stashForRecovery(rawInput: string): boolean {
    if (!rawInput || rawInput.length > MAX_STASH_CHARS) return false;
    try {
        sessionStorage.setItem(STASH_KEY, rawInput);
        return true;
    } catch {
        return false;
    }
}

/** Reads the stash exactly once; a second call returns null. */
export function takeRecoveryStash(): string | null {
    try {
        const stashed = sessionStorage.getItem(STASH_KEY);
        sessionStorage.removeItem(STASH_KEY);
        sessionStorage.removeItem(RELOAD_FLAG);
        return stashed;
    } catch {
        return null;
    }
}

/**
 * Reloads with the cache bypassed so the fresh HTML brings a chunk manifest
 * that matches what the server actually has.
 *
 * Guarded by a session flag: if the reload did not fix it, the second failure
 * leaves the user on the page with the error rather than looping.
 */
export function reloadForFreshChunks(): boolean {
    try {
        if (sessionStorage.getItem(RELOAD_FLAG) === '1') return false;
        sessionStorage.setItem(RELOAD_FLAG, '1');
    } catch {
        // No sessionStorage: one reload is still better than none, and
        // without the flag the user can simply choose not to press again.
    }
    window.location.reload();
    return true;
}
