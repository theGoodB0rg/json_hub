import { describe, it, expect } from '@jest/globals';
import { expandToTableView } from '@/lib/parsers/tableView';
import { JSON_TEMPLATES } from '@/lib/templates/jsonTemplates';

describe('Amplitude Platform Converter Verification', () => {
    it('should flatten Amplitude JSON template and extract user and event properties', () => {
        const amplitudeTemplate = JSON_TEMPLATES.find(t => t.id === 'amplitude-events-export');
        expect(amplitudeTemplate).toBeDefined();

        if (amplitudeTemplate) {
            const data = JSON.parse(amplitudeTemplate.data);
            
            // Amplitude export is an array of events
            const { rows, schema } = expandToTableView(data);

            // Verify that we have 2 events
            expect(rows.length).toBe(2);

            // Verify that nested properties are flattened properly
            const firstRow = rows.find(r => r['event_type'] === 'Purchase Complete');
            
            expect(firstRow).toBeDefined();
            
            if (firstRow) {
                // Assert nested properties exist in the flattened row
                expect(firstRow['user_properties.subscription_tier']).toBe('Pro');
                expect(firstRow['user_properties.ltv']).toBe(450.00);
                expect(firstRow['event_properties.item_category']).toBe('Electronics');
                expect(firstRow['event_properties.discount_applied']).toBe(true);
            }
        }
    });
});
