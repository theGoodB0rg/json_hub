import { fitTitle, TITLE_MAX } from './seo';

describe('fitTitle', () => {
    it('keeps the brand when it fits', () => {
        expect(fitTitle(['5 Ways to Convert JSON to Excel - JsonExport', '5 Ways to Convert JSON to Excel'])).toBe(
            '5 Ways to Convert JSON to Excel - JsonExport'
        );
    });

    it('drops the brand when it would push the title past the cut', () => {
        const headline = 'Open Large JSON Files in Excel Without Crashing Fast';
        const out = fitTitle([`${headline} - JsonExport`, headline]);
        expect(out).toBe(headline);
        expect(out.length).toBeLessThanOrEqual(TITLE_MAX);
    });

    it('returns the shortest candidate when none fit', () => {
        const long = 'x'.repeat(80);
        expect(fitTitle([`${long} - JsonExport`, long])).toBe(long);
    });
});
