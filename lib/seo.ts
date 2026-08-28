import type { Metadata } from 'next';
import { ROUTES, toAbsoluteUrl } from '@/lib/routes';

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
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
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
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}
