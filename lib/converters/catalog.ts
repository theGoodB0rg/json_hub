import { converterPages, ConverterPageConfig } from '@/lib/platform-data';
import { conversionMatrix, ContentMatrixItem } from '@/lib/content-matrix/matrix';
import { ROUTES, converterPath, conversionPath } from '@/lib/routes';

export type ConverterCategory =
    | 'all'
    | 'format'
    | 'crm'
    | 'ecommerce'
    | 'analytics'
    | 'project-management'
    | 'finance'
    | 'database'
    | 'communication'
    | 'cloud-storage'
    | 'automation';

export interface ConverterCatalogItem {
    id: string;
    slug: string;
    href: string;
    title: string;
    shortTitle: string;
    description: string;
    platformName: string;
    sourceFormat: 'json' | 'csv' | 'xml';
    targetFormat: 'excel' | 'csv' | 'json';
    category: ConverterCategory;
    badgeText?: string;
    isPlatformIntegration: boolean;
    isFeatured?: boolean;
    popularityScore: number;
}

export const CATEGORY_LABELS: Record<ConverterCategory, string> = {
    all: 'All Converters',
    format: 'Core Formats',
    crm: 'CRM & Sales',
    ecommerce: 'E-commerce & Payments',
    analytics: 'Analytics & Product',
    'project-management': 'Project Management',
    finance: 'Accounting & Finance',
    database: 'Databases & Backend',
    communication: 'Communication & Forms',
    'cloud-storage': 'Cloud Storage',
    automation: 'Workflows & Automation',
};

function assignPlatformCategory(platform: string, slug: string): ConverterCategory {
    const p = platform.toLowerCase();
    if (p.includes('salesforce') || p.includes('hubspot') || p.includes('pipedrive')) return 'crm';
    if (p.includes('stripe') || p.includes('shopify')) return 'ecommerce';
    if (p.includes('mixpanel') || p.includes('amplitude') || p.includes('youtube')) return 'analytics';
    if (p.includes('jira') || p.includes('trello') || p.includes('asana') || p.includes('notion')) return 'project-management';
    if (p.includes('quickbooks') || p.includes('xero') || p.includes('harvest')) return 'finance';
    if (p.includes('mongo') || p.includes('postgres')) return 'database';
    if (p.includes('slack') || p.includes('discord') || p.includes('intercom') || p.includes('typeform') || p.includes('mailchimp') || p.includes('calendly')) return 'communication';
    if (p.includes('dropbox') || p.includes('onedrive') || p.includes('google')) return 'cloud-storage';
    if (p.includes('make') || p.includes('clockify') || p.includes('timetonic')) return 'automation';
    return 'format';
}

function deriveFormatsFromSlug(slug: string): { source: 'json' | 'csv' | 'xml'; target: 'excel' | 'csv' | 'json' } {
    if (slug.includes('csv-to-json')) return { source: 'csv', target: 'json' };
    if (slug.includes('csv-to-excel')) return { source: 'csv', target: 'excel' };
    if (slug.includes('xml-to-excel')) return { source: 'xml', target: 'excel' };
    if (slug.includes('xml-to-json')) return { source: 'xml', target: 'json' };
    if (slug.includes('to-csv')) return { source: 'json', target: 'csv' };
    if (slug.includes('to-excel')) return { source: 'json', target: 'excel' };
    return { source: 'json', target: 'excel' };
}

/**
 * Builds the unified converter catalog combining platform converters and format matrix conversions
 */
export function getUnifiedCatalog(): ConverterCatalogItem[] {
    const catalog: ConverterCatalogItem[] = [];

    // 1. Format Matrix Items (Core Format Transformations)
    for (const matrix of conversionMatrix) {
        catalog.push({
            id: `matrix-${matrix.slug}`,
            slug: matrix.slug,
            href: conversionPath(matrix.slug),
            title: matrix.h1,
            shortTitle: `${matrix.sourceFormat.toUpperCase()} to ${matrix.targetFormat.toUpperCase()}`,
            description: matrix.description,
            platformName: matrix.platformName,
            sourceFormat: matrix.sourceFormat,
            targetFormat: matrix.targetFormat,
            category: matrix.platformName === 'Jira' ? 'project-management' : matrix.platformName === 'Shopify' ? 'ecommerce' : 'format',
            badgeText: matrix.badgeText,
            isPlatformIntegration: matrix.platformName !== 'CSV' && matrix.platformName !== 'XML' && matrix.platformName !== 'JSON',
            isFeatured: true,
            popularityScore: 95,
        });
    }

    // 2. Platform Presets & Converters
    for (const page of converterPages) {
        const { source, target } = deriveFormatsFromSlug(page.slug);
        const category = assignPlatformCategory(page.platformName, page.slug);
        const isFeatured = ['stripe-json-to-excel', 'hubspot-json-to-excel', 'salesforce-json-to-excel', 'shopify-json-to-csv', 'jira-json-to-excel', 'quickbooks-json-to-excel'].includes(page.slug);

        catalog.push({
            id: `platform-${page.slug}`,
            slug: page.slug,
            href: converterPath(page.slug),
            title: page.h1,
            shortTitle: `${page.platformName} to ${target === 'excel' ? 'Excel' : target.toUpperCase()}`,
            description: page.description,
            platformName: page.platformName,
            sourceFormat: source,
            targetFormat: target,
            category,
            badgeText: isFeatured ? 'Popular' : undefined,
            isPlatformIntegration: true,
            isFeatured,
            popularityScore: isFeatured ? 90 : 75,
        });
    }

    return catalog;
}

/**
 * Returns all catalog items
 */
export const CONVERTER_CATALOG = getUnifiedCatalog();

/**
 * Filter items by category
 */
export function getConvertersByCategory(category: ConverterCategory): ConverterCatalogItem[] {
    if (category === 'all') return CONVERTER_CATALOG;
    return CONVERTER_CATALOG.filter((item) => item.category === category);
}

/**
 * Search converters by term across platform name, title, description, and format keywords
 */
export function searchConverters(query: string, items = CONVERTER_CATALOG): ConverterCatalogItem[] {
    if (!query || !query.trim()) return items;
    const q = query.toLowerCase().trim();

    return items.filter((item) => {
        return (
            item.platformName.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q) ||
            item.shortTitle.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.slug.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            `${item.sourceFormat} to ${item.targetFormat}`.includes(q)
        );
    });
}

/**
 * Recommends related converters by category similarity and format alignment
 */
export function getRelatedConverters(currentSlug: string, limit = 6): ConverterCatalogItem[] {
    const current = CONVERTER_CATALOG.find((c) => c.slug === currentSlug);
    if (!current) {
        return CONVERTER_CATALOG.slice(0, limit);
    }

    // 1. Same category first
    const sameCategory = CONVERTER_CATALOG.filter(
        (c) => c.slug !== currentSlug && c.category === current.category
    );

    // 2. Same target format or source format next
    const sameFormat = CONVERTER_CATALOG.filter(
        (c) => c.slug !== currentSlug && c.category !== current.category && (c.sourceFormat === current.sourceFormat || c.targetFormat === current.targetFormat)
    );

    // 3. Featured items fallback
    const featured = CONVERTER_CATALOG.filter(
        (c) => c.slug !== currentSlug && !sameCategory.includes(c) && !sameFormat.includes(c)
    );

    const combined = [...sameCategory, ...sameFormat, ...featured];
    return combined.slice(0, limit);
}
