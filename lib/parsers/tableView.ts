import type { FlattenResult } from '@/types/parser.types';

/**
 * Table View Transformer
 * 
 * Expands nested JSON into rows with parent data repetition,
 * similar to jsontotable.org behavior.
 * 
 * Key differences from flattener.ts:
 * - Flattens nested arrays by creating multiple rows (one per array item)
 * - Repeats parent properties on each child row
 * - Handles primitive arrays as comma-separated values
 * - Uses clean column names without prefixes
 */

/**
 * Detects if a value is primitive (not object or array)
 */
function isPrimitive(value: any): boolean {
    return value === null || (typeof value !== 'object');
}

/**
 * Detects if an array contains only primitive values
 */
function isPrimitiveArray(arr: any[]): boolean {
    return arr.every(item => isPrimitive(item));
}

/**
 * Removes common prefix from column names for cleaner headers
 * e.g., ["products.name", "products.price"] => ["name", "price"]
 */
function cleanColumnNames(schema: string[]): string[] {
    if (schema.length === 0) return schema;

    // Find common prefix
    const parts = schema.map(col => col.split('.'));
    const minParts = Math.min(...parts.map(p => p.length));

    let commonPrefixLength = 0;
    for (let i = 0; i < minParts - 1; i++) {
        const prefix = parts[0][i];
        if (parts.every(p => p[i] === prefix)) {
            commonPrefixLength = i + 1;
        } else {
            break;
        }
    }

    // Remove common prefix
    if (commonPrefixLength > 0) {
        return schema.map(col => {
            const colParts = col.split('.');
            return colParts.slice(commonPrefixLength).join('.');
        });
    }

    return schema;
}

/**
 * Expands JSON data into table view with row expansion
 * @param data - Parsed JSON data (object or array)
 * @returns FlattenResult with expanded rows and clean schema
 */
export function expandToTableView(data: any): FlattenResult {
    // Handle null or undefined
    if (data === null || data === undefined) {
        return { rows: [], schema: [] };
    }

    // Convert single object to array for consistent processing
    const dataArray = Array.isArray(data) ? data : [data];

    // Handle empty array
    if (dataArray.length === 0) {
        return { rows: [], schema: [] };
    }

    // Expand all rows
    const expandedRows: Record<string, any>[] = [];
    const allKeys = new Set<string>();

    for (const item of dataArray) {
        const expanded = expandObject(item);
        expandedRows.push(...expanded);
        expanded.forEach(row => Object.keys(row).forEach(key => allKeys.add(key)));
    }

    // Create schema with original keys
    const originalSchema = Array.from(allKeys).sort();

    // Clean the schema for display
    const cleanSchema = cleanColumnNames(originalSchema);

    // Map rows to use clean column names
    const normalizedRows = expandedRows.map((row) => {
        const normalizedRow: Record<string, any> = {};
        originalSchema.forEach((originalKey, index) => {
            const cleanKey = cleanSchema[index];
            normalizedRow[cleanKey] = row[originalKey] !== undefined ? row[originalKey] : null;
        });
        return normalizedRow;
    });

    return {
        rows: normalizedRows,
        schema: cleanSchema,
    };
}

/**
 * Recursively expands a single object into multiple rows
 * @param obj - Object to expand
 * @param prefix - Current key prefix (for recursion)
 * @param parentContext - Parent properties to include in each row
 * @returns Array of expanded rows
 */
function expandObject(
    obj: any,
    prefix: string = '',
    parentContext: Record<string, any> = {}
): Record<string, any>[] {
    // Handle primitive values
    if (isPrimitive(obj)) {
        const key = prefix || 'value';
        return [{ ...parentContext, [key]: obj }];
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        // Empty array
        if (obj.length === 0) {
            return [{ ...parentContext, [prefix]: null }];
        }

        // Primitive array - join as comma-separated string
        if (isPrimitiveArray(obj)) {
            const formatted = obj.join(', ');
            return [{ ...parentContext, [prefix]: formatted }];
        }

        // Array of objects/arrays - expand into multiple rows
        const expandedRows: Record<string, any>[] = [];
        obj.forEach((item, index) => {
            const itemKey = prefix; // Don't add index to key, keep it clean
            const itemRows = expandObject(item, itemKey, parentContext);
            expandedRows.push(...itemRows);
        });
        return expandedRows;
    }

    // Handle objects
    const entries = Object.entries(obj);

    if (entries.length === 0) {
        return [{ ...parentContext }];
    }

    // Separate properties into primitives and complex types
    const primitiveProps: Record<string, any> = {};
    const complexProps: Array<[string, any]> = [];

    for (const [key, value] of entries) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (isPrimitive(value)) {
            primitiveProps[fullKey] = value;
        } else if (Array.isArray(value) && isPrimitiveArray(value)) {
            // Primitive arrays are treated as primitive properties
            primitiveProps[fullKey] = value.join(', ');
        } else {
            complexProps.push([fullKey, value]);
        }
    }

    // If no complex properties, return single row with primitives
    if (complexProps.length === 0) {
        return [{ ...parentContext, ...primitiveProps }];
    }

    // Merge parent context with current level primitives
    const currentContext = { ...parentContext, ...primitiveProps };

    // Expand the first complex property
    const [firstKey, firstValue] = complexProps[0];
    let currentRows = expandObject(firstValue, firstKey, currentContext);

    // For each additional complex property, cross-join
    for (let i = 1; i < complexProps.length; i++) {
        const [key, value] = complexProps[i];
        const newRows: Record<string, any>[] = [];

        // For each current row, expand the next complex property
        for (const currentRow of currentRows) {
            const expanded = expandObject(value, key, currentRow);
            newRows.push(...expanded);
        }

        currentRows = newRows;
    }

    return currentRows;
}

/**
 * Helper to format nested data for HTML table preview
 * This creates a structure suitable for rendering nested tables in cells
 */
export interface TableViewCell {
    type: 'primitive' | 'table';
    value?: any;
    tableData?: {
        headers: string[];
        rows: Record<string, any>[];
    };
}

/**
 * Converts JSON to table view structure with nested table metadata
 * Used for HTML preview rendering
 */
export function jsonToTableViewStructure(data: any): {
    headers: string[];
    rows: Array<Record<string, TableViewCell>>;
} {
    if (!Array.isArray(data)) {
        data = [data];
    }

    if (data.length === 0) {
        return { headers: [], rows: [] };
    }

    // Analyze first item to determine structure
    const firstItem = data[0];
    const headers: string[] = [];
    const cells: Record<string, 'primitive' | 'table'> = {};

    for (const [key, value] of Object.entries(firstItem)) {
        headers.push(key);

        if (Array.isArray(value) && value.length > 0 && !isPrimitive(value[0])) {
            cells[key] = 'table';
        } else {
            cells[key] = 'primitive';
        }
    }

    // Build rows
    const rows = data.map((item: any) => {
        const row: Record<string, TableViewCell> = {};

        for (const header of headers) {
            const value = item[header];

            if (cells[header] === 'table' && Array.isArray(value)) {
                // Create nested table structure
                if (value.length === 0) {
                    row[header] = { type: 'primitive', value: null };
                } else {
                    const nestedHeaders = Object.keys(value[0]);
                    row[header] = {
                        type: 'table',
                        tableData: {
                            headers: nestedHeaders,
                            rows: value
                        }
                    };
                }
            } else if (Array.isArray(value) && isPrimitiveArray(value)) {
                // Format primitive arrays
                row[header] = { type: 'primitive', value: value.join(', ') };
            } else {
                row[header] = { type: 'primitive', value };
            }
        }

        return row;
    });

    return { headers, rows };
}
