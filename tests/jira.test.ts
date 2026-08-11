import { describe, it, expect } from '@jest/globals';
import { expandToTableView } from '@/lib/parsers/tableView';
import { JSON_TEMPLATES } from '@/lib/templates/jsonTemplates';

describe('Jira Platform Converter Verification', () => {
    it('should flatten Jira JSON template and extract custom fields', () => {
        const jiraTemplate = JSON_TEMPLATES.find(t => t.id === 'jira-issues-export');
        expect(jiraTemplate).toBeDefined();

        if (jiraTemplate) {
            const data = JSON.parse(jiraTemplate.data);
            
            // Expand to Table View (which is what the user mostly uses for Jira)
            // The table view usually expects an array, so we pass data.issues
            const { rows, schema } = expandToTableView(data.issues);

            // Verify that we have 2 issues
            expect(rows.length).toBe(2);

            // Verify that nested custom fields are lifted properly
            // e.g. fields.customfield_10014
            const firstRow = rows.find(r => r['key'] === 'ENG-101' || r['fields.key'] === 'ENG-101' || r['id'] === '10002');
            
            expect(firstRow).toBeDefined();
            
            if (firstRow) {
                // Assert custom fields exist in the flattened row
                expect(firstRow['fields.customfield_10014']).toBe('SPRINT-42');
                expect(firstRow['fields.creator.displayName']).toBe('Alice Engineer');
                expect(firstRow['fields.status.name']).toBe('In Progress');
            }
        }
    });
});
