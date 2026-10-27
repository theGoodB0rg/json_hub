import { execFileSync } from 'child_process';

/**
 * Honest `<lastmod>` values for the sitemap.
 *
 * The sitemap stamped `new Date()` on 63 of 103 URLs, so every deploy told
 * Google that nearly every page had just changed. Google only trusts lastmod
 * from sites where it has proven accurate, and ignores it otherwise — so the
 * signal that would steer crawling toward pages that actually changed was
 * thrown away, on a site where 66 of 103 URLs have never been crawled.
 *
 * Each URL now takes the commit date of the file(s) that define its content.
 * Build-time only (it shells out to git), which is fine for a static export.
 */

type GitRunner = (args: string[]) => string;

const defaultRun: GitRunner = (args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

/** Used when git history is unavailable. Fixed on purpose: a constant says
 *  nothing, where "now" would claim a change that did not happen. */
export const LASTMOD_FALLBACK = new Date('2026-10-01T00:00:00Z');

const cache = new Map<string, Date | null>();

function commitDate(path: string, run: GitRunner): Date | null {
    if (cache.has(path)) return cache.get(path) ?? null;
    let result: Date | null = null;
    try {
        // Literal pathspecs: Next route folders like `app/blog/[slug]` are
        // otherwise read by git as glob character classes and match nothing.
        const out = run(['--literal-pathspecs', 'log', '-1', '--format=%cI', '--', path]).trim();
        const parsed = out ? new Date(out) : null;
        result = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    } catch {
        result = null;
    }
    cache.set(path, result);
    return result;
}

/** Newest commit date across `paths`, or `fallback` when none has history. */
export function lastModifiedFor(
    paths: string[],
    fallback: Date = LASTMOD_FALLBACK,
    run: GitRunner = defaultRun
): Date {
    const dates = paths.map((p) => commitDate(p, run)).filter((d): d is Date => d !== null);
    if (dates.length === 0) return fallback;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
}

/** Test hook: the cache is module-level, so tests must reset it. */
export function resetLastmodCache(): void {
    cache.clear();
}
