import { MetadataRoute } from 'next'
import { getSortedPostsData } from '@/lib/blog'

import { converterPages } from '@/lib/platform-data'
import { dummyDatasets } from '@/lib/dummy-data'
import {
    ROUTES,
    blogPostPath,
    converterPath,
    testDataPath,
    toAbsoluteUrl,
} from '@/lib/routes'

export default function sitemap(): MetadataRoute.Sitemap {
    const posts = getSortedPostsData()

    const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: toAbsoluteUrl(blogPostPath(post.id)),
        lastModified: new Date(post.date),
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    const converterEntries: MetadataRoute.Sitemap = converterPages.map((page) => ({
        url: toAbsoluteUrl(converterPath(page.slug)),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
    }))

    const testDataEntries: MetadataRoute.Sitemap = dummyDatasets.map((dataset) => ({
        url: toAbsoluteUrl(testDataPath(dataset.slug)),
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
    }))

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: toAbsoluteUrl(ROUTES.alternativesPowerQuery),
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: toAbsoluteUrl(ROUTES.alternativesPythonPandas),
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: toAbsoluteUrl(ROUTES.recommendedTools),
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: toAbsoluteUrl(ROUTES.privacySecurity),
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: toAbsoluteUrl(ROUTES.testData),
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: toAbsoluteUrl(ROUTES.jsonToExcel),
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: toAbsoluteUrl(ROUTES.jsonToCsv),
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: toAbsoluteUrl(ROUTES.blog),
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ]

    return [
        {
            url: toAbsoluteUrl(ROUTES.home),
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...converterEntries,
        ...testDataEntries,
        ...staticPages,
        ...blogEntries,
    ]
}
