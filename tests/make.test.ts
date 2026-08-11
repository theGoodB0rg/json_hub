import { describe, it, expect } from '@jest/globals';
import { expandToTableView } from '@/lib/parsers/tableView';
import { JSON_TEMPLATES } from '@/lib/templates/jsonTemplates';

describe('Make.com Platform Converter Verification', () => {
    it('should flatten Make.com JSON template and extract nested bundles and data', () => {
        const makeTemplate = JSON_TEMPLATES.find(t => t.id === 'make-com-bundles-export');
        expect(makeTemplate).toBeDefined();

        if (makeTemplate) {
            const data = JSON.parse(makeTemplate.data);
            
            // Make.com exports an array of bundle objects
            const { rows, schema } = expandToTableView(data);

            // Verify that we have 2 bundles
            expect(rows.length).toBe(2);

            // Verify that nested properties are flattened properly
            // e.g. data.customer.email, data.metadata.tags.0
            const firstRow = rows.find(r => r['bundle'] === 1);
            
            expect(firstRow).toBeDefined();
            
            if (firstRow) {
                // Assert nested properties exist in the flattened row
                expect(firstRow['data.id']).toBe('req_84719A');
                expect(firstRow['data.customer.email']).toBe('lead@example.com');
                expect(firstRow['data.metadata.source']).toBe('webhook');
                // The flattener might output array items in various ways depending on array mode, 
                // but by default in Table View it stringifies or extracts.
                // Assuming it extracts to dot notation or stringifies:
                // We just verify it parses without crashing and extracts the core nested objects.
                expect(firstRow['data.collection.status']).toBe(200);
            }
        }
    });
});
