import type { FlattenResult } from '@/types/parser.types';

/**
 * Flattens nested JSON objects into spreadsheet-style rows
 * @param data - Parsed JSON data (object or array)
 * @returns FlattenResult with rows and schema
 */
export function flattenJSON(data: any): FlattenResult {
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

    // Flatten all rows
    const flatRows: Record<string, any>[] = [];
    const allKeys = new Set<string>();

    for (const item of dataArray) {
        const flatRow = flattenObject(item);
        flatRows.push(flatRow);

        // Collect all keys for schema
        Object.keys(flatRow).forEach((key) => allKeys.add(key));
    }

    // Create schema (sorted for consistency)
    const schema = Array.from(allKeys).sort();

    // Ensure all rows have all columns (fill missing with null)
    const normalizedRows = flatRows.map((row) => {
        const normalizedRow: Record<string, any> = {};
        schema.forEach((key) => {
            normalizedRow[key] = row[key] !== undefined ? row[key] : null;
        });
        return normalizedRow;
    });

    return {
        rows: normalizedRows,
        schema,
    };
}

/**
 * Recursively flattens a single object using dot notation
 * @param obj - Object to flatten
 * @param prefix - Current key prefix (for recursion)
 * @returns Flattened object with dot-notation keys
 */
function flattenObject(
    obj: any,
    prefix: string = '',
    visited: Set<any> = new Set()
): Record<string, any> {
    const result: Record<string, any> = {};

    // Handle circular references
    if (obj !== null && typeof obj === 'object') {
        if (visited.has(obj)) {
            return { [prefix || 'circular']: '[Circular Reference]' };
        }
        visited.add(obj);
    }

    // Handle primitive types
    if (obj === null || typeof obj !== 'object') {
        return { [prefix]: obj };
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        // For arrays, create indexed keys
        obj.forEach((item, index) => {
            const key = prefix ? `${prefix}.${index}` : `${index}`;
            const flattened = flattenObject(item, key, new Set(visited));
            Object.assign(result, flattened);
        });
        return result;
    }

    // Handle objects
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === null) {
            result[newKey] = null;
        } else if (typeof value === 'object') {
            // Recursively flatten nested objects
            const flattened = flattenObject(value, newKey, new Set(visited));
            Object.assign(result, flattened);
        } else {
            // Primitive value
            result[newKey] = value;
        }
    }

    return result;
}

/**
 * Infers schema from first N rows to detect all possible columns
 * @param data - Array of objects
 * @param sampleSize - Number of rows to sample (default: 50)
 * @returns Array of column names
 */
export function inferSchema(data: any[], sampleSize: number = 50): string[] {
    const allKeys = new Set<string>();
    const sample = data.slice(0, sampleSize);

    for (const item of sample) {
        const flatRow = flattenObject(item);
        Object.keys(flatRow).forEach((key) => allKeys.add(key));
    }

    return Array.from(allKeys).sort();
}

/**
 * Unflatten a flat object back to nested structure
 * @param flatObj - Flat object with dot-notation keys
 * @returns Nested object
 */
export function unflattenObject(flatObj: Record<string, any>): any {
    const result: any = {};

    for (const [key, value] of Object.entries(flatObj)) {
        const keys = key.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            const nextKey = keys[i + 1];

            // Check if next key is a number (array index)
            const isArray = /^\d+$/.test(nextKey);

            if (!(k in current)) {
                current[k] = isArray ? [] : {};
            }

            current = current[k];
        }

        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
    }

    return result;
}
