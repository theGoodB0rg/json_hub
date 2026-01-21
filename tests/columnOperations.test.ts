/**
 * Column Operations Test Suite
 * Tests visibility toggle, rename, reorder, and export verification
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { flattenJSON } from '@/lib/parsers/flattener';
import { expandToTableView } from '@/lib/parsers/tableView';
import { jsonToCsv } from '@/lib/converters/jsonToCsv';
import { jsonToHtml } from '@/lib/converters/jsonToHtml';
import { jsonToXlsx } from '@/lib/converters/jsonToXlsx';
import * as XLSX from 'xlsx';

// Sample data for testing
const sampleData = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
];

const nestedData = {
    users: [
        {
            id: 1,
            name: 'Alice',
            profile: {
                bio: 'Developer',
                avatar: 'alice.png'
            }
        },
        {
            id: 2,
            name: 'Bob',
            profile: {
                bio: 'Designer',
                avatar: 'bob.png'
            }
        }
    ]
};

describe('Column Visibility Operations', () => {
    it('should exclude columns from CSV export', () => {
        const schema = ['id', 'name', 'email', 'age'];
        const excludedColumns = ['email'];

        // Filter schema to simulate exclusion
        const effectiveSchema = schema.filter(col => !excludedColumns.includes(col));

        const csv = jsonToCsv(sampleData, effectiveSchema);

        expect(csv).toContain('id');
        expect(csv).toContain('name');
        expect(csv).toContain('age');
        expect(csv).not.toContain('email');
        expect(csv).not.toContain('alice@example.com');
    });

    it('should exclude columns from HTML export', () => {
        const schema = ['id', 'name', 'email', 'age'];
        const excludedColumns = ['age'];

        const effectiveSchema = schema.filter(col => !excludedColumns.includes(col));

        const html = jsonToHtml(sampleData, effectiveSchema);

        expect(html).toContain('<th>id</th>');
        expect(html).toContain('<th>name</th>');
        expect(html).toContain('<th>email</th>');
        expect(html).not.toContain('<th>age</th>');
        expect(html).not.toContain('<td>30</td>');
    });

    it('should exclude columns from Excel export', () => {
        const schema = ['id', 'name', 'email', 'age'];
        const excludedColumns = ['id', 'email'];

        const effectiveSchema = schema.filter(col => !excludedColumns.includes(col));

        const workbook = jsonToXlsx(sampleData, effectiveSchema);
        const sheet = workbook.Sheets['Data'];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        // First row is headers
        const headers = data[0];

        expect(headers).toContain('name');
        expect(headers).toContain('age');
        expect(headers).not.toContain('id');
        expect(headers).not.toContain('email');
    });

    it('should handle multiple excluded columns', () => {
        const schema = ['id', 'name', 'email', 'age'];
        const excludedColumns = ['id', 'age'];

        const effectiveSchema = schema.filter(col => !excludedColumns.includes(col));

        expect(effectiveSchema).toEqual(['name', 'email']);

        const csv = jsonToCsv(sampleData, effectiveSchema);
        expect(csv).toContain('name,email');
        expect(csv).not.toContain('id');
        expect(csv).not.toContain('age');
    });
});

describe('Column Rename Operations', () => {
    it('should rename column in schema', () => {
        const schema = ['id', 'name', 'email', 'age'];
        const oldName = 'email';
        const newName = 'email_address';

        const newSchema = schema.map(col => col === oldName ? newName : col);

        expect(newSchema).toEqual(['id', 'name', 'email_address', 'age']);
    });

    it('should rename column in flattened data rows', () => {
        const flatData = [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
        ];

        const oldName = 'email';
        const newName = 'contact_email';

        const newFlatData = flatData.map(row => {
            if (!(oldName in row)) return row;
            const newRow = { ...row };
            newRow[newName] = newRow[oldName];
            delete (newRow as any)[oldName];
            return newRow;
        });

        expect(newFlatData[0]).toHaveProperty('contact_email');
        expect(newFlatData[0]).not.toHaveProperty('email');
        expect(newFlatData[0]['contact_email']).toBe('alice@example.com');
    });

    it('should export with renamed columns in CSV', () => {
        const data = [
            { id: 1, contact_email: 'alice@example.com' },
            { id: 2, contact_email: 'bob@example.com' },
        ];
        const schema = ['id', 'contact_email'];

        const csv = jsonToCsv(data, schema);

        expect(csv).toContain('contact_email');
        expect(csv).not.toContain(',email,'); // Should not have old name
    });

    it('should preserve renamed column in columnOrder', () => {
        const columnOrder = ['name', 'email', 'id', 'age'];
        const oldName = 'email';
        const newName = 'email_address';

        const newColumnOrder = columnOrder.map(col => col === oldName ? newName : col);

        expect(newColumnOrder).toEqual(['name', 'email_address', 'id', 'age']);
        expect(newColumnOrder.indexOf('email_address')).toBe(1); // Position preserved
    });
});

describe('Column Order Operations', () => {
    it('should reorder columns and reflect in export', () => {
        const data = sampleData;
        const reorderedSchema = ['age', 'name', 'id', 'email']; // Reordered

        const csv = jsonToCsv(data, reorderedSchema);
        const lines = csv.split('\n');
        const header = lines[0].replace('\ufeff', ''); // Remove BOM

        expect(header).toBe('age,name,id,email');
    });

    it('should maintain column order after adding exclusions', () => {
        const columnOrder = ['id', 'name', 'email', 'age'];
        const excludedColumns = ['email'];

        const visibleColumns = columnOrder.filter(col => !excludedColumns.includes(col));

        expect(visibleColumns).toEqual(['id', 'name', 'age']);
        // Position of remaining columns should be maintained
        expect(visibleColumns.indexOf('name')).toBeLessThan(visibleColumns.indexOf('age'));
    });
});

describe('Combined Operations - Edit then Export', () => {
    it('should apply edits, hide columns, rename, and export correctly', () => {
        // 1. Start with data
        let data = [...sampleData];
        let schema = ['id', 'name', 'email', 'age'];
        let columnOrder = [...schema];
        let excludedColumns: string[] = [];

        // 2. Edit a cell (simulate updateCell)
        data[0] = { ...data[0], name: 'Alicia' }; // Changed from Alice to Alicia

        // 3. Hide a column (simulate toggleColumnVisibility)
        excludedColumns.push('email');

        // 4. Rename a column (simulate renameColumn)
        const oldName = 'age';
        const newName = 'years_old';
        schema = schema.map(col => col === oldName ? newName : col);
        columnOrder = columnOrder.map(col => col === oldName ? newName : col);
        data = data.map(row => {
            const newRow = { ...row, [newName]: row[oldName] };
            delete (newRow as any)[oldName];
            return newRow;
        });

        // 5. Apply exclusions for export
        const effectiveSchema = columnOrder.filter(col => !excludedColumns.includes(col));

        // 6. Export to CSV
        const csv = jsonToCsv(data, effectiveSchema);

        // Verify all operations
        expect(csv).toContain('Alicia'); // Edit applied
        expect(csv).not.toContain('email'); // Column hidden
        expect(csv).not.toContain('alice@example.com'); // Hidden column data not present
        expect(csv).toContain('years_old'); // Column renamed
        expect(csv).not.toContain(',age,'); // Old column name not present
        expect(csv).toContain('30'); // Renamed column still has data
    });
});

describe('Nested Data Column Operations', () => {
    it('should flatten nested data and respect column exclusions', () => {
        const { rows, schema } = flattenJSON(nestedData);

        // Schema should include nested paths
        expect(schema).toContain('users.0.name');
        expect(schema).toContain('users.0.profile.bio');

        // Simulate excluding a nested column
        const excludedColumns = ['users.0.profile.avatar', 'users.1.profile.avatar'];
        const effectiveSchema = schema.filter(col => !excludedColumns.includes(col));

        const csv = jsonToCsv(rows, effectiveSchema);

        expect(csv).not.toContain('avatar');
    });

    it('should work with table view export', () => {
        const { rows, schema } = expandToTableView(nestedData.users);

        expect(schema).toContain('name');
        expect(schema).toContain('profile.bio');

        // Exclude profile.avatar
        const excludedColumns = ['profile.avatar'];
        const effectiveSchema = schema.filter(col => !excludedColumns.includes(col));

        const html = jsonToHtml(rows, effectiveSchema);

        expect(html).toContain('bio');
        expect(html).not.toContain('avatar');
    });
});
