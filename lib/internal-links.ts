/**
 * Internal link graph.
 *
 * The problem this solves, measured via the GSC URL Inspection API on
 * 2026-10-10 across all 103 sitemap URLs:
 *
 *   24  Submitted and indexed
 *   10  Crawled - currently not indexed
 *   32  Discovered - currently not indexed   (lastCrawlTime: NEVER)
 *   36  URL is unknown to Google
 *
 * The sitemap is not the problem — it is submitted, carries 103 URLs, reports
 * zero errors, and Google last downloaded it on 2026-10-05. Google simply is
 * not spending crawl budget here, and 76 of 103 pages earn nothing.
 *
 * Hub pages (/blog, /converters) do link every child in static HTML, so the
 * gap is not a rendering problem either. The gap is that the 24 pages Google
 * actually crawls were crawl *dead ends*: a blog post's only internal link was
 * "Back to Blog". Crawl equity arrived and had nowhere to go.
 *
 * So: every content page now links onward to topically related pages, and
 * relatedness is computed from the content itself rather than hand-curated,
 * which keeps the graph dense as pages are added. Selection is deterministic —
 * the same page always emits the same links — because a graph that reshuffles
 * per build teaches a crawler nothing.
 */

import { converterPages } from '@/lib/platform-data';
import { dummyDatasets } from '@/lib/dummy-data';
import { ROUTES, converterPath, testDataPath } from '@/lib/routes';

export interface LinkTarget {
    href: string;
    title: string;
    description?: string;
    kind: 'blog' | 'converter' | 'dataset' | 'tool';
}

/** Words that appear on nearly every page and so carry no signal. */
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'for', 'with', 'how', 'your',
    'you', 'is', 'are', 'it', 'on', 'from', 'by', 'this', 'that', 'guide', 'free',
    'online', 'best', 'use', 'using', 'what', 'why', 'when', 'convert', 'converter',
    'json', 'data', 'file', 'files', 'tool', 'tools', 'export', 'exports',
]);

function tokenize(text: string): Set<string> {
    const out = new Set<string>();
    for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
        if (raw.length < 3) continue;
        if (STOP_WORDS.has(raw)) continue;
        out.add(raw);
    }
    return out;
}

/**
 * Jaccard-style overlap, biased toward the candidate's own vocabulary so a
 * long article does not out-score a tightly-focused converter page purely by
 * having more words.
 */
function relatedness(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    let shared = 0;
    for (const t of a) if (b.has(t)) shared++;
    return shared / Math.min(a.size, b.size);
}

interface Candidate extends LinkTarget {
    tokens: Set<string>;
}

function converterCandidates(): Candidate[] {
    return converterPages.map((c) => ({
        href: converterPath(c.slug),
        title: c.h1 || c.title,
        description: c.subheading || c.description,
        kind: 'converter' as const,
        tokens: tokenize(`${c.platformName} ${c.title} ${c.subheading} ${c.description}`),
    }));
}

function datasetCandidates(): Candidate[] {
    return dummyDatasets.map((d) => ({
        href: testDataPath(d.slug),
        title: d.title,
        description: d.description,
        kind: 'dataset' as const,
        tokens: tokenize(`${d.platform} ${d.title} ${d.description}`),
    }));
}

export interface BlogSummary {
    id: string;
    title: string;
    description?: string;
}

function blogCandidates(posts: BlogSummary[]): Candidate[] {
    return posts.map((p) => ({
        href: `${ROUTES.blog}/${p.id}`,
        title: p.title,
        description: p.description,
        kind: 'blog' as const,
        tokens: tokenize(`${p.title} ${p.description ?? ''}`),
    }));
}

/**
 * Pick the `limit` most related targets, excluding the current page.
 *
 * Ties break on href so the output is stable across builds. When nothing is
 * related enough, the remaining slots are filled in href order rather than
 * left empty — a crawler following a weak link still reaches a page that was
 * otherwise never crawled, which is the entire point here.
 */
function pick(seed: Set<string>, candidates: Candidate[], excludeHref: string, limit: number): LinkTarget[] {
    const scored = candidates
        .filter((c) => c.href !== excludeHref)
        .map((c) => ({ c, score: relatedness(seed, c.tokens) }))
        .sort((a, b) => b.score - a.score || a.c.href.localeCompare(b.c.href));

    return scored.slice(0, limit).map(({ c }) => ({
        href: c.href,
        title: c.title,
        description: c.description,
        kind: c.kind,
    }));
}

/**
 * Related links for a blog post: other posts, plus the converters and sample
 * datasets the post is actually about. Mixing kinds matters — it is what
 * connects the blog cluster to the converter cluster, which otherwise only
 * meet at the footer.
 */
export function relatedForBlogPost(
    post: BlogSummary,
    allPosts: BlogSummary[]
): LinkTarget[] {
    const seed = tokenize(`${post.title} ${post.description ?? ''}`);
    const here = `${ROUTES.blog}/${post.id}`;
    return [
        ...pick(seed, blogCandidates(allPosts), here, 3),
        ...pick(seed, converterCandidates(), here, 2),
        ...pick(seed, datasetCandidates(), here, 1),
    ];
}

/** Related links for a converter page: sibling converters, datasets, guides. */
export function relatedForConverter(slug: string, posts: BlogSummary[]): LinkTarget[] {
    const config = converterPages.find((c) => c.slug === slug);
    const here = converterPath(slug);
    const seed = config
        ? tokenize(`${config.platformName} ${config.title} ${config.subheading} ${config.description}`)
        : tokenize(slug.replace(/-/g, ' '));

    return [
        ...pick(seed, converterCandidates(), here, 3),
        ...pick(seed, datasetCandidates(), here, 1),
        ...pick(seed, blogCandidates(posts), here, 2),
    ];
}

/** Related links for a sample-dataset page. */
export function relatedForDataset(slug: string, posts: BlogSummary[]): LinkTarget[] {
    const dataset = dummyDatasets.find((d) => d.slug === slug);
    const here = testDataPath(slug);
    const seed = dataset
        ? tokenize(`${dataset.platform} ${dataset.title} ${dataset.description}`)
        : tokenize(slug.replace(/-/g, ' '));

    return [
        ...pick(seed, datasetCandidates(), here, 2),
        ...pick(seed, converterCandidates(), here, 2),
        ...pick(seed, blogCandidates(posts), here, 2),
    ];
}
