import { MetadataRoute } from 'next'
import { getSortedPostsData } from '@/lib/blog'

import { converterPages } from '@/lib/converters'

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

    return [
        {
            url: 'https://jsonexport.com',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...converterEntries,
        ...blogEntries,
    ]
}
