import { MetadataRoute } from 'next'
import { getSortedPostsData } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
    const posts = getSortedPostsData()

    const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `https://jsonexport.com/blog/${post.id}`,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    return [
        {
            url: 'https://jsonexport.com',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...blogEntries,
    ]
}
