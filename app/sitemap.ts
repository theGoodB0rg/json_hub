import { MetadataRoute } from 'next'
import { getSortedPostsData } from '@/lib/blog'
import { lastModifiedFor } from '@/lib/lastmod'

import { converterPages } from '@/lib/platform-data'
import { dummyDatasets } from '@/lib/dummy-data'
import { conversionMatrix } from '@/lib/content-matrix/matrix'
import {
    ROUTES,
    blogPostPath,
    converterPath,
    conversionPath,
    testDataPath,
    toAbsoluteUrl,
} from '@/lib/routes'

// lastModified is the commit date of the files that define each page, never
// the build time. See lib/lastmod.ts for why "now" on every URL is harmful.
export default function sitemap(): MetadataRoute.Sitemap {
    const posts = getSortedPostsData()

    const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: toAbsoluteUrl(blogPostPath(post.id)),
        lastModified: lastModifiedFor([`content/blog/${post.id}.md`], new Date(post.date)),
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    const converterModified = lastModifiedFor(['lib/platform-data.ts', 'app/converters/[slug]/page.tsx'])
    const converterEntries: MetadataRoute.Sitemap = converterPages.map((page) => ({
        url: toAbsoluteUrl(converterPath(page.slug)),
        lastModified: converterModified,
        changeFrequency: 'weekly',
        priority: 0.9,
    }))

    const matrixModified = lastModifiedFor(['lib/content-matrix'])
    const matrixEntries: MetadataRoute.Sitemap = conversionMatrix.map((item) => ({
        url: toAbsoluteUrl(conversionPath(item.slug)),
        lastModified: matrixModified,
        changeFrequency: 'weekly',
        priority: 0.9,
    }))

    const testDataModified = lastModifiedFor(['lib/dummy-data.ts', 'app/test-data/[slug]/page.tsx'])
    const testDataEntries: MetadataRoute.Sitemap = dummyDatasets.map((dataset) => ({
        url: toAbsoluteUrl(testDataPath(dataset.slug)),
        lastModified: testDataModified,
        changeFrequency: 'monthly',
        priority: 0.7,
    }))

    // A hub changes when anything it lists does.
    const newestPost = posts.reduce<Date | undefined>((newest, p) => {
        const d = new Date(p.date)
        return !newest || d > newest ? d : newest
    }, undefined)
    const blogHubModified = lastModifiedFor(['app/blog/page.tsx'], newestPost)

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: toAbsoluteUrl(ROUTES.alternativesPowerQuery),
            lastModified: lastModifiedFor(['app/alternatives/power-query']),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: toAbsoluteUrl(ROUTES.alternativesPythonPandas),
            lastModified: lastModifiedFor(['app/alternatives/python-pandas']),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: toAbsoluteUrl(ROUTES.recommendedTools),
            lastModified: lastModifiedFor(['app/recommended-tools']),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: toAbsoluteUrl(ROUTES.privacySecurity),
            lastModified: lastModifiedFor(['app/privacy-security']),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: toAbsoluteUrl(ROUTES.testData),
            lastModified: lastModifiedFor(['app/test-data/page.tsx', 'lib/dummy-data.ts']),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: toAbsoluteUrl(ROUTES.jsonToExcel),
            lastModified: lastModifiedFor(['app/json-to-excel']),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: toAbsoluteUrl(ROUTES.jsonToCsv),
            lastModified: lastModifiedFor(['app/json-to-csv']),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: toAbsoluteUrl(ROUTES.converters),
            lastModified: lastModifiedFor(['app/converters/page.tsx', 'lib/platform-data.ts']),
            changeFrequency: 'daily',
            priority: 0.95,
        },
        {
            url: toAbsoluteUrl(ROUTES.blog),
            lastModified: blogHubModified,
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ]


    return [
        {
            url: toAbsoluteUrl(ROUTES.home),
            lastModified: lastModifiedFor(['app/page.tsx']),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...converterEntries,
        ...matrixEntries,
        ...testDataEntries,
        ...staticPages,
        ...blogEntries,
    ]
}
