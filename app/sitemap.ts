import { MetadataRoute } from 'next'
import { getSortedPostsData } from '@/lib/blog'

import { converterPages } from '@/lib/platform-data'
import { dummyDatasets } from '@/lib/dummy-data'

export default function sitemap(): MetadataRoute.Sitemap {
    const posts = getSortedPostsData()

    const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `https://jsonexport.com/blog/${post.id}`,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    const converterEntries: MetadataRoute.Sitemap = converterPages.map((page) => ({
        url: `https://jsonexport.com/converters/${page.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
    }))

    const testDataEntries: MetadataRoute.Sitemap = dummyDatasets.map((dataset) => ({
        url: `https://jsonexport.com/test-data/${dataset.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
    }))

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: 'https://jsonexport.com/alternatives/power-query',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: 'https://jsonexport.com/alternatives/python-pandas',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: 'https://jsonexport.com/privacy-security',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: 'https://jsonexport.com/test-data',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }
    ]

    return [
        {
            url: 'https://jsonexport.com',
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
