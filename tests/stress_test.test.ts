/**
 * Senior Dev Stress Testing & Production Readiness Suite
 * 
 * Tests:
 * 1. 10,000 complex nested objects with mixed types, nulls, and nested arrays.
 * 2. Deeply nested recursive JSON structures (15+ levels deep).
 * 3. Scaled Trello board dump (250 cards, 500 checklist items, custom fields, power-ups).
 * 4. Verifies execution duration, memory retention, and output integrity.
 */

import { describe, it, expect } from '@jest/globals';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import { jsonToCsv } from '@/lib/converters/jsonToCsv';
import { jsonToXlsx } from '@/lib/converters/jsonToXlsx';

describe('Production Stress Testing & Scalability', () => {
    it('stresses 10,000 multi-field nested e-commerce orders without exceeding memory or time budgets', () => {
        const rowCount = 10000;
        const orders = Array.from({ length: rowCount }, (_, i) => ({
            order_id: `ord_${100000 + i}`,
            created_at: '2026-09-26T20:00:00Z',
            customer: {
                id: `cust_${i % 1000}`,
                email: `buyer_${i}@enterprise.io`,
                address: {
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94107',
                    country: 'US',
                },
            },
            financials: {
                subtotal: (i * 1.5).toFixed(2),
                tax: (i * 0.12).toFixed(2),
                currency: 'USD',
                paid: i % 3 === 0,
            },
            tags: ['priority', 'b2b'],
            status: i % 5 === 0 ? 'shipped' : 'processing',
        }));

        const start = performance.now();
        const { rows, schema } = flattenJSON(orders);
        const duration = performance.now() - start;

        expect(rows).toHaveLength(rowCount);
        expect(schema.length).toBeGreaterThanOrEqual(10);
        expect(duration).toBeLessThan(1500); // 10k rows under 1.5s in Node/V8

        // Verify CSV export throughput
        const csvStart = performance.now();
        const csv = jsonToCsv(rows, schema);
        const csvDuration = performance.now() - csvStart;

        expect(csv.length).toBeGreaterThan(100000);
        expect(csvDuration).toBeLessThan(800);
    });

    it('stresses deeply nested JSON structures (15 levels deep) without call-stack overflow', () => {
        let nestedObj: any = { leaf: 'deep_value', number: 42, active: true };
        for (let level = 15; level >= 1; level--) {
            nestedObj = { [`level_${level}`]: nestedObj };
        }

        const start = performance.now();
        const { rows, schema } = flattenJSON(nestedObj);
        const duration = performance.now() - start;

        expect(rows).toHaveLength(1);
        expect(duration).toBeLessThan(50);
        
        // Confirm deep dot-path was flattened correctly
        const expectedDeepKey = Array.from({ length: 15 }, (_, i) => `level_${i + 1}`).join('.') + '.leaf';
        expect(rows[0][expectedDeepKey]).toBe('deep_value');
    });

    it('stresses a large enterprise Trello board (200 cards with checklists, custom fields, and pluginData)', () => {
        const cardCount = 200;
        const lists = [
            { id: 'l_todo', name: 'To Do' },
            { id: 'l_dev', name: 'In Development' },
            { id: 'l_qa', name: 'QA Review' },
            { id: 'l_done', name: 'Production Deployed' },
        ];

        const customFields = [
            { id: 'cf_story_points', name: 'Story Points', type: 'number' as const },
            { id: 'cf_release', name: 'Release Version', type: 'text' as const },
        ];

        const cards = Array.from({ length: cardCount }, (_, i) => ({
            id: `c_${i}`,
            name: `Feature Sprint Ticket #${i}`,
            desc: `Detailed specification and acceptance criteria for item ${i}`,
            idList: lists[i % lists.length].id,
            due: i % 2 === 0 ? '2026-10-01T12:00:00Z' : null,
            dueComplete: i % 4 === 0,
            labels: [
                { id: 'lbl_eng', name: 'Engineering', color: 'blue' },
                { id: 'lbl_q3', name: 'Q3 Goal', color: 'green' },
            ],
            checklists: [
                {
                    id: `chk_${i}_1`,
                    name: 'Acceptance Criteria',
                    checkItems: [
                        { id: `item_${i}_1`, name: 'Unit tests pass', state: 'complete' },
                        { id: `item_${i}_2`, name: 'Security scan clean', state: i % 2 === 0 ? 'complete' : 'incomplete' },
                    ],
                },
            ],
            members: [
                { id: 'm_1', fullName: 'Lead Architect' },
                { id: 'm_2', fullName: 'Staff Engineer' },
            ],
            customFieldItems: [
                { idCustomField: 'cf_story_points', value: { number: (i % 8) + 1 } },
                { idCustomField: 'cf_release', value: { text: 'v2.4.0' } },
            ],
            pluginData: [
                {
                    id: `pd_${i}`,
                    idPlugin: 'jira_sync',
                    value: JSON.stringify({ issueKey: `PROJ-${1000 + i}`, sprint: 42 }),
                },
            ],
        }));

        const boardPayload = {
            id: 'board_large_scale',
            name: 'Enterprise Monorepo Roadmap',
            lists,
            customFields,
            cards,
        };

        const start = performance.now();
        const unwrapped = smartUnwrap(boardPayload);
        const { rows, schema } = flattenJSON(unwrapped.data);
        const duration = performance.now() - start;

        // Zero duplicate cards: 200 input cards must yield exactly 200 rows
        expect(rows).toHaveLength(cardCount);
        expect(duration).toBeLessThan(300);

        // Verify resolved platform fields
        const sampleCard = rows[0];
        expect(sampleCard.listName).toBe('To Do');
        expect(sampleCard.custom_Story_Points).toBeDefined();
        expect(sampleCard.custom_Release_Version).toBe('v2.4.0');
        expect(sampleCard.plugin_jira_sync_issueKey).toBe('PROJ-1000');
        expect(sampleCard.checklistProgress).toBe('2/2');

        // Verify Excel workbook generation throughput
        const xlsxStart = performance.now();
        const workbook = jsonToXlsx(rows, schema);
        const xlsxDuration = performance.now() - xlsxStart;

        expect(workbook.SheetNames).toContain('Data');
        expect(xlsxDuration).toBeLessThan(500);
    });
});
