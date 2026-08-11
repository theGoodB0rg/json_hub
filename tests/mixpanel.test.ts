import { describe, it, expect } from '@jest/globals';
import { expandToTableView } from '@/lib/parsers/tableView';
import { JSON_TEMPLATES } from '@/lib/templates/jsonTemplates';

describe('Mixpanel Platform Converter Verification', () => {
    it('should flatten Mixpanel JSON template and extract nested properties', () => {
        const mixpanelTemplate = JSON_TEMPLATES.find(t => t.id === 'mixpanel-events-export');
        expect(mixpanelTemplate).toBeDefined();

        if (mixpanelTemplate) {
            const data = JSON.parse(mixpanelTemplate.data);
            
            // Mixpanel export is usually an array of events
            const { rows, schema } = expandToTableView(data);

            // Verify that we have 2 events
            expect(rows.length).toBe(2);

            // Verify that nested properties are flattened properly
            // e.g. properties.time, properties.distinct_id
            const firstRow = rows.find(r => r['event'] === 'Viewed Page');
            
            expect(firstRow).toBeDefined();
            
            if (firstRow) {
                // Assert custom properties exist in the flattened row
                expect(firstRow['properties.distinct_id']).toBe('user_789');
                expect(firstRow['properties.$city']).toBe('San Francisco');
                expect(firstRow['properties.page_name']).toBe('Pricing');
            }

            const secondRow = rows.find(r => r['event'] === 'Sign Up');
            expect(secondRow).toBeDefined();

            if (secondRow) {
                expect(secondRow['properties.plan']).toBe('Premium');
                expect(secondRow['properties.referral_code']).toBe('FRIEND20');
            }
        }
    });
});
