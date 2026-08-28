import { loadGscData } from './gsc-parser';
import path from 'path';

describe('gsc-parser', () => {
    it('should parse GSC csv data and calculate metrics', () => {
        const testDir = path.resolve(process.cwd(), 'docs', 'gsc_data');
        const summary = loadGscData(testDir);

        expect(summary.totalClicks).toBeGreaterThan(0);
        expect(summary.totalImpressions).toBeGreaterThan(0);
        expect(summary.topQueries.length).toBeGreaterThan(0);
        expect(summary.topPages.length).toBeGreaterThan(0);
        expect(summary.opportunityQueries.length).toBeGreaterThan(0);

        // Top query should be "json export" or "trello json to csv"
        expect(summary.topQueries[0]).toHaveProperty('query');
        expect(summary.topQueries[0]).toHaveProperty('clicks');
        expect(summary.topQueries[0]).toHaveProperty('impressions');

        // Check top page
        expect(summary.topPages[0]).toHaveProperty('page');
        expect(summary.topPages[0].clicks).toBeGreaterThan(0);
    });

    it('should handle missing directory gracefully without throwing', () => {
        const summary = loadGscData('/non-existent-path');
        expect(summary.totalClicks).toBe(0);
        expect(summary.topQueries).toEqual([]);
    });
});
