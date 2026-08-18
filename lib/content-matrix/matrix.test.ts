import { conversionMatrix, getMatrixItem, getAllMatrixSlugs } from './matrix';
import { pluginRegistry } from '@/lib/plugins/registry';

describe('ContentMatrix', () => {
    it('contains valid and unique slugs', () => {
        const slugs = getAllMatrixSlugs();
        const uniqueSlugs = new Set(slugs);
        expect(slugs.length).toBe(uniqueSlugs.size);
        expect(slugs.length).toBeGreaterThan(0);
    });

    it('ensures every matrix item points to a registered plugin', () => {
        for (const item of conversionMatrix) {
            const plugin = pluginRegistry.get(item.pluginId);
            expect(plugin).toBeDefined();
            expect(plugin?.id).toBe(item.pluginId);
        }
    });

    it('ensures each page has non-thin, unique content and valid sample data', () => {
        const titles = new Set<string>();
        const descriptions = new Set<string>();

        for (const item of conversionMatrix) {
            expect(item.title.length).toBeGreaterThan(20);
            expect(item.description.length).toBeGreaterThan(50);
            expect(item.sampleData.trim().length).toBeGreaterThan(20);
            expect(item.content.features.length).toBeGreaterThanOrEqual(3);
            expect(item.faqs.length).toBeGreaterThanOrEqual(2);

            expect(titles.has(item.title)).toBe(false);
            expect(descriptions.has(item.description)).toBe(false);

            titles.add(item.title);
            descriptions.add(item.description);
        }
    });

    it('can retrieve matrix items by slug', () => {
        const item = getMatrixItem('csv-to-json');
        expect(item).toBeDefined();
        expect(item?.platformName).toBe('CSV');
        expect(item?.sourceFormat).toBe('csv');
    });
});
