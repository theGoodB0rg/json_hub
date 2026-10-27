import type { Metadata } from 'next';
import { ROUTES, SITE_ORIGIN, toAbsoluteUrl } from '@/lib/routes';

/** Roughly where a search result cuts a title off (~600px). */
export const TITLE_MAX = 60;

/**
 * First candidate that fits in a search result, else the shortest one.
 *
 * Titles were composed as `<headline> - JsonExport`, so the brand suffix was
 * often what pushed a headline past the cut and the closing words — the ones
 * a searcher scans for — were lost. List candidates longest-to-shortest and
 * the brand only appears when there is room for it.
 */
export function fitTitle(candidates: string[], max: number = TITLE_MAX): string {
    const fits = candidates.find((c) => c.length <= max);
    if (fits) return fits;
    return candidates.reduce((a, b) => (b.length < a.length ? b : a));
}

interface BuildPageMetadataInput {
    title: string;
    description?: string;
    canonicalPath?: string;
}

interface BuildArticleMetadataInput extends BuildPageMetadataInput {
    publishedTime?: string;
}

export function buildPageMetadata({
    title,
    description,
    canonicalPath = ROUTES.home,
}: BuildPageMetadataInput): Metadata {
    const url = toAbsoluteUrl(canonicalPath);
    // Explicit OG image: the per-converter opengraph-image.tsx route cannot
    // emit files under `output: 'export'` (static hosts have no edge runtime),
    // so Next's auto meta (/converters/<slug>/opengraph-image?hash) 404s —
    // flagged in GSC Page indexing. Point everything at the root static PNG.
    const ogImage = `${SITE_ORIGIN}/opengraph-image.png`;
    return {
        title,
        description,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title,
            description,
            type: 'website',
            url,
            siteName: 'JsonExport',
            images: [{ url: ogImage, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export function buildArticleMetadata({
    title,
    description,
    canonicalPath,
    publishedTime,
}: BuildArticleMetadataInput): Metadata {
    const canonical = canonicalPath ?? ROUTES.home;

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            type: 'article',
            publishedTime,
            url: toAbsoluteUrl(canonical),
            images: [{ url: `${SITE_ORIGIN}/opengraph-image.png`, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [`${SITE_ORIGIN}/opengraph-image.png`],
        },
    };
}
