import { dummyDatasets } from './dummy-data';

/** Google truncates the SERP title around 60 characters. An overridden
 *  seoTitle exists precisely to win the click, so it must survive intact. */
const SERP_TITLE_LIMIT = 60;

describe('dummy dataset SEO metadata', () => {
    it('has unique slugs', () => {
        const slugs = dummyDatasets.map((d) => d.slug);
        expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('keeps every seoTitle short enough to render untruncated', () => {
        for (const dataset of dummyDatasets) {
            if (!dataset.seoTitle) continue;
            expect(dataset.seoTitle.length).toBeLessThanOrEqual(SERP_TITLE_LIMIT);
        }
    });

    it('pairs a seoDescription with every seoTitle', () => {
        for (const dataset of dummyDatasets) {
            if (!dataset.seoTitle) continue;
            expect(dataset.seoDescription && dataset.seoDescription.length).toBeTruthy();
        }
    });

    describe('complex-nested-json-example', () => {
        const dataset = dummyDatasets.find((d) => d.slug === 'complex-nested-json-example')!;

        it('exists', () => {
            expect(dataset).toBeDefined();
        });

        it('leads its title with the query it was losing', () => {
            // 385 impressions, 0 clicks at position 12.6 under the old title,
            // which never contained the word the searcher typed.
            expect(dataset.seoTitle!.toLowerCase()).toContain('nested json example');
            expect(dataset.seoTitle!.toLowerCase().indexOf('nested json example')).toBe(0);
        });

        it('keeps "complex", which its converting queries use', () => {
            expect(dataset.seoTitle!.toLowerCase()).toContain('complex');
        });

        it('does not lead the searcher with a converter upsell', () => {
            expect(dataset.seoTitle!.toLowerCase()).not.toContain('convert to excel');
        });
    });
});
