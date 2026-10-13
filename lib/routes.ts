export const SITE_ORIGIN = 'https://jsonexport.com';

export const ROUTES = {
    home: '/',
    blog: '/blog',
    converters: '/converters',
    testData: '/test-data',
    jsonToExcel: '/json-to-excel',
    jsonToCsv: '/json-to-csv',
    recommendedTools: '/recommended-tools',
    alternativesPowerQuery: '/alternatives/power-query',
    alternativesPythonPandas: '/alternatives/python-pandas',
    privacySecurity: '/privacy-security',
    security: '/security',
    sitemap: '/sitemap.xml',
    shopifyGuide: '/blog/shopify-line-items-excel-export-fix',
    desktop: '/desktop',
    activate: '/activate',
} as const;

function normalizePath(pathname: string): string {
    if (!pathname) return ROUTES.home;
    // Guard against absolute URLs: new URL('/https://...', origin) would
    // otherwise produce a doubled URL like
    // https://jsonexport.com/https://jsonexport.com/... (seen as 404s in GSC).
    const withoutOrigin = pathname.startsWith(SITE_ORIGIN)
        ? pathname.slice(SITE_ORIGIN.length)
        : pathname;
    return withoutOrigin.startsWith('/') ? withoutOrigin : `/${withoutOrigin}`;
}

export function toAbsoluteUrl(pathname: string = ROUTES.home): string {
    return new URL(normalizePath(pathname), SITE_ORIGIN).toString();
}

export function converterPath(slug: string): string {
    return `${ROUTES.converters}/${slug}`;
}

export function conversionPath(slug: string): string {
    return `/${slug}`;
}

export function testDataPath(slug: string): string {
    return `${ROUTES.testData}/${slug}`;
}

export function blogPostPath(slug: string): string {
    return `${ROUTES.blog}/${slug}`;
}
