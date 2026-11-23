import { FREE_EXPORT_LIMIT_BYTES, FREE_SAMPLE_ROWS, freeSampleRows } from './limits';

describe('freeSampleRows', () => {
    it('returns every row when the file is within the free size', () => {
        expect(freeSampleRows(50_000, FREE_EXPORT_LIMIT_BYTES)).toBe(50_000);
    });

    it('gives the rows that fit in the free size, not a flat 1,000', () => {
        // 17 MB file of 34,000 rows: 15/17 of the rows fit.
        const bytes = 17 * 1024 * 1024;
        expect(freeSampleRows(34_000, bytes)).toBe(Math.floor((34_000 * FREE_EXPORT_LIMIT_BYTES) / bytes));
    });

    it('never gives fewer than the floor', () => {
        expect(freeSampleRows(5_000, 500 * 1024 * 1024)).toBe(FREE_SAMPLE_ROWS);
    });

    it('never gives more rows than the file has', () => {
        expect(freeSampleRows(300, 200 * 1024 * 1024)).toBe(300);
    });
});
