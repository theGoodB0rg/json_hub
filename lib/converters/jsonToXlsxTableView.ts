import * as XLSX from 'xlsx';

/**
 * Converts JSON to Excel with nested table structure using merged cells
 * Handles multi-level nesting correctly
 */
export function generateTableXlsx(data: any): XLSX.WorkBook | null {
    const items = Array.isArray(data) ? data : [data];
    if (items.length === 0) return null;

    console.log('=== Excel Table View Export ===');
    console.log('Input data:', JSON.stringify(items, null, 2));

    // Build flat rows with all nested data expanded
    const allRows: Record<string, any>[] = [];
    const columnHeaders: string[] = [];
    const columnHeadersSet = new Set<string>();

    // Helper to check if value is primitive
    const isPrimitive = (val: any): boolean => {
        return val === null || typeof val !== 'object';
    };

    // Helper to check if array contains only primitives
    const isPrimitiveArray = (arr: any[]): boolean => {
        return arr.every(item => isPrimitive(item));
    };

    // Recursive function to flatten nested structures
    function flattenObject(obj: any, prefix: string = ''): Record<string, any>[] {
        if (isPrimitive(obj)) {
            return [{ [prefix || 'value']: obj }];
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return [{ [prefix]: '[]' }];
            }
            if (isPrimitiveArray(obj)) {
                return [{ [prefix]: obj.join(', ') }];
            }

            // Array of objects - expand each
            const expanded: Record<string, any>[] = [];
            for (const item of obj) {
                const itemRows = flattenObject(item, prefix);
                expanded.push(...itemRows);
            }
            return expanded;
        }

        // Object - process each property
        const entries = Object.entries(obj);
        if (entries.length === 0) {
            return [{ [prefix]: '{}' }];
        }

        // Separate simple and complex properties
        const simpleProps: Record<string, any> = {};
        const complexProps: Array<[string, any]> = [];

        for (const [key, value] of entries) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (isPrimitive(value)) {
                simpleProps[fullKey] = value;
            } else if (Array.isArray(value) && isPrimitiveArray(value)) {
                simpleProps[fullKey] = value.join(', ');
            } else {
                complexProps.push([fullKey, value]);
            }
        }

        // If no complex props, return single row
        if (complexProps.length === 0) {
            return [simpleProps];
        }

        // Expand first complex prop
        let rows = flattenObject(complexProps[0][1], complexProps[0][0]);

        // Merge simple props into all rows
        rows = rows.map(row => ({ ...simpleProps, ...row }));

        // Cross-join with remaining complex props
        for (let i = 1; i < complexProps.length; i++) {
            const [key, value] = complexProps[i];
            const newRows: Record<string, any>[] = [];

            for (const currentRow of rows) {
                const expandedValues = flattenObject(value, key);
                for (const expandedRow of expandedValues) {
                    newRows.push({ ...currentRow, ...expandedRow });
                }
            }

            rows = newRows;
        }

        return rows;
    }

    // Flatten all items
    for (const item of items) {
        const flatRows = flattenObject(item);
        allRows.push(...flatRows);

        // Collect all column names
        for (const row of flatRows) {
            for (const key of Object.keys(row)) {
                columnHeadersSet.add(key);
            }
        }
    }

    // Create sorted column headers
    columnHeaders.push(...Array.from(columnHeadersSet).sort());

    console.log('Column headers:', columnHeaders);
    console.log('Total rows:', allRows.length);

    // Build worksheet data
    const wsData: any[][] = [];
    wsData.push(columnHeaders);

    // Add data rows
    for (const row of allRows) {
        const dataRow: any[] = [];
        for (const col of columnHeaders) {
            dataRow.push(row[col] ?? null);
        }
        wsData.push(dataRow);
    }

    console.log('Worksheet data sample:', wsData.slice(0, 3));

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = columnHeaders.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    return wb;
}

/**
 * Downloads Excel file with table view structure
 */
export function jsonToXlsxTableView(data: any, filename: string = 'table-export.xlsx'): void {
    const wb = generateTableXlsx(data);
    if (!wb) return;

    // Download
    XLSX.writeFile(wb, filename);
    console.log('=== Excel export complete ===');
}
