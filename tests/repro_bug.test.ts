
import { jsonToTableViewStructure, expandToTableView } from '../lib/parsers/tableView';

describe('Table View Bug - Mixed Empty Arrays', () => {
    it('should correctly identify table structure even if first item has empty array', () => {
        const input = [
            { id: 1, variants: [] },
            { id: 2, variants: [{ size: 'S' }] }
        ];
        const result = jsonToTableViewStructure(input);

        // For the second item, variants should be 'table' type because it contains an object array
        // The first item determined the schema as 'primitive' because it was empty, causing this to be 'primitive' with value [object Object]

        const secondRowVariants = result.rows[1].variants;

        expect(secondRowVariants.type).toBe('table');
        expect(secondRowVariants.tableData).toBeDefined();
        if (secondRowVariants.type === 'table') {
            expect(secondRowVariants.tableData?.rows).toHaveLength(1);
        }
    });

    it('should expand mixed empty arrays correctly in flat view', () => {
        const input = [
            { id: 1, variants: [] },
            { id: 2, variants: [{ size: 'S' }] }
        ];
        const result = expandToTableView(input);
        console.log('DEBUG Expanded Rows:', JSON.stringify(result.rows, null, 2));

        // Should have 2 rows. 
        // Row 1: id=1, variants... something?
        // Row 2: id=2, variants.size=S

        expect(result.rows).toHaveLength(2);
        const row2 = result.rows.find(r => r.id === 2);
        expect(row2!['variants.size']).toBe('S');
    });
});
