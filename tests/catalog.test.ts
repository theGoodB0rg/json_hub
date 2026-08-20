import {
    CONVERTER_CATALOG,
    getUnifiedCatalog,
    getConvertersByCategory,
    searchConverters,
    getRelatedConverters,
    CATEGORY_LABELS,
} from '@/lib/converters/catalog';
import { converterPages } from '@/lib/platform-data';
import { conversionMatrix } from '@/lib/content-matrix/matrix';

describe('Converter Catalog & Discovery Architecture', () => {
    it('aggregates all matrix items and platform pages into unified catalog', () => {
        const expectedTotal = conversionMatrix.length + converterPages.length;
        expect(CONVERTER_CATALOG.length).toBe(expectedTotal);
    });

    it('ensures every catalog item has unique id and slug', () => {
        const ids = new Set<string>();
        const slugs = new Set<string>();

        CONVERTER_CATALOG.forEach((item) => {
            expect(ids.has(item.id)).toBe(false);
            expect(slugs.has(item.slug)).toBe(false);
            ids.add(item.id);
            slugs.add(item.slug);
        });
    });

    it('ensures every item has valid category and non-empty title/description', () => {
        CONVERTER_CATALOG.forEach((item) => {
            expect(CATEGORY_LABELS[item.category]).toBeDefined();
            expect(item.title.length).toBeGreaterThan(5);
            expect(item.description.length).toBeGreaterThan(10);
            expect(item.href.startsWith('/')).toBe(true);
        });
    });

    it('filters items by category correctly', () => {
        const crmItems = getConvertersByCategory('crm');
        expect(crmItems.length).toBeGreaterThan(0);
        crmItems.forEach((item) => {
            expect(item.category).toBe('crm');
        });

        const allItems = getConvertersByCategory('all');
        expect(allItems.length).toBe(CONVERTER_CATALOG.length);
    });

    it('searches converters by keyword, platform, and format pairs', () => {
        const stripeResults = searchConverters('stripe');
        expect(stripeResults.some((item) => item.platformName.toLowerCase() === 'stripe')).toBe(true);

        const csvResults = searchConverters('csv');
        expect(csvResults.length).toBeGreaterThan(0);

        const xmlResults = searchConverters('xml to excel');
        expect(xmlResults.some((item) => item.slug === 'xml-to-excel')).toBe(true);

        const emptyResults = searchConverters('nonexistentquery12345');
        expect(emptyResults.length).toBe(0);
    });

    it('provides semantic related tool recommendations without returning current tool', () => {
        const stripeSlug = 'stripe-json-to-excel';
        const related = getRelatedConverters(stripeSlug, 4);

        expect(related.length).toBe(4);
        expect(related.some((item) => item.slug === stripeSlug)).toBe(false);
    });
});
