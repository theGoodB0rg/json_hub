/**
 * Performance Test Suite
 * Verifies that large dataset operations complete within acceptable time thresholds
 */

import { describe, it, expect } from '@jest/globals';
import { flattenJSON } from '@/lib/parsers/flattener';
import { expandToTableView } from '@/lib/parsers/tableView';
import { jsonToCsv } from '@/lib/converters/jsonToCsv';
import { jsonToHtml } from '@/lib/converters/jsonToHtml';

// Generate large test datasets
const generateLargeData = (rowCount: number) =>
    Array.from({ length: rowCount }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@test.com`,
        value: Math.random(),
        timestamp: new Date().toISOString(),
    }));

const generateNestedData = (rowCount: number) => ({
    users: Array.from({ length: rowCount }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        profile: {
            bio: `Bio for user ${i}`,
            avatar: `avatar${i}.png`,
            settings: {
                theme: i % 2 === 0 ? 'dark' : 'light',
                notifications: true,
            },
        },
    })),
});

describe('Large Dataset Performance', () => {
    describe('Flattening Performance', () => {
        it('should flatten 1k rows in under 100ms', () => {
            const data = generateLargeData(1000);
            const start = performance.now();
            flattenJSON(data);
            const duration = performance.now() - start;

            console.log(`Flatten 1k rows: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(100);
        });

        it('should flatten 10k rows in under 500ms', () => {
            const data = generateLargeData(10000);
            const start = performance.now();
            flattenJSON(data);
            const duration = performance.now() - start;

            console.log(`Flatten 10k rows: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(500);
        });

        it('should flatten nested data (1k items) in under 200ms', () => {
            const data = generateNestedData(1000);
            const start = performance.now();
            flattenJSON(data);
            const duration = performance.now() - start;

            console.log(`Flatten nested 1k items: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(200);
        });
    });

    describe('CSV Export Performance', () => {
        it('should export 1k rows to CSV in under 50ms', () => {
            const data = generateLargeData(1000);
            const schema = ['id', 'name', 'email', 'value', 'timestamp'];
            const start = performance.now();
            jsonToCsv(data, schema);
            const duration = performance.now() - start;

            console.log(`CSV export 1k rows: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(50);
        });

        it('should export 10k rows to CSV in under 500ms', () => {
            const data = generateLargeData(10000);
            const schema = ['id', 'name', 'email', 'value', 'timestamp'];
            const start = performance.now();
            jsonToCsv(data, schema);
            const duration = performance.now() - start;

            console.log(`CSV export 10k rows: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(500);
        });
    });

    describe('HTML Export Performance', () => {
        it('should export 1k rows to HTML in under 100ms', () => {
            const data = generateLargeData(1000);
            const schema = ['id', 'name', 'email', 'value', 'timestamp'];
            const start = performance.now();
            jsonToHtml(data, schema);
            const duration = performance.now() - start;

            console.log(`HTML export 1k rows: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Table View Expansion Performance', () => {
        it('should expand 1k rows to table view in under 100ms', () => {
            const data = generateLargeData(1000);
            const start = performance.now();
            expandToTableView(data);
            const duration = performance.now() - start;

            console.log(`Table view expand 1k rows: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Column Operations Performance', () => {
        it('should filter columns by exclusion instantly (O(columns))', () => {
            const schema = Array.from({ length: 100 }, (_, i) => `column_${i}`);
            const excludedColumns = ['column_5', 'column_10', 'column_15'];

            const start = performance.now();
            // Simulate column filtering - this should be O(columns), not O(rows)
            for (let i = 0; i < 1000; i++) { // Run 1000 times to get measurable time
                schema.filter(col => !excludedColumns.includes(col));
            }
            const duration = performance.now() - start;

            console.log(`Column filter 1000 iterations: ${duration.toFixed(2)}ms`);
            // Should be extremely fast - under 10ms for 1000 iterations
            expect(duration).toBeLessThan(10);
        });

        it('should reorder columns instantly (O(columns))', () => {
            const columnOrder = Array.from({ length: 100 }, (_, i) => `column_${i}`);

            const start = performance.now();
            // Simulate column reorder - this should be O(columns), not O(rows)
            for (let i = 0; i < 1000; i++) {
                const oldIndex = 5;
                const newIndex = 50;
                const newOrder = [...columnOrder];
                const [removed] = newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, removed);
            }
            const duration = performance.now() - start;

            console.log(`Column reorder 1000 iterations: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(10);
        });
    });
});

describe('Memory Efficiency', () => {
    it('should handle schema with many columns efficiently', () => {
        // Generate data with 50 columns
        const generateWideData = (rows: number, cols: number) => {
            return Array.from({ length: rows }, (_, rowIdx) => {
                const row: Record<string, any> = {};
                for (let c = 0; c < cols; c++) {
                    row[`col_${c}`] = `value_${rowIdx}_${c}`;
                }
                return row;
            });
        };

        const data = generateWideData(1000, 50);
        const start = performance.now();
        const result = flattenJSON(data);
        const duration = performance.now() - start;

        console.log(`Flatten 1k rows × 50 cols: ${duration.toFixed(2)}ms`);
        expect(result.schema.length).toBe(50);
        expect(result.rows.length).toBe(1000);
        expect(duration).toBeLessThan(200);
    });
});
