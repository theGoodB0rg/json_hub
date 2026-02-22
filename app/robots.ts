import { MetadataRoute } from 'next'
import { ROUTES, toAbsoluteUrl } from '@/lib/routes'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: toAbsoluteUrl(ROUTES.sitemap),
    }
}
