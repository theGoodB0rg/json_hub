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
} as const;

function normalizePath(pathname: string): string {
    if (!pathname) return ROUTES.home;
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
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
