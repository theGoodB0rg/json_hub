import type { FlattenResult } from '@/types/parser.types';

// Maximum depth for array expansion to prevent column explosion
const MAX_ARRAY_EXPANSION_DEPTH = 1;

// Maximum number of array elements to check for type detection
const ARRAY_SAMPLE_SIZE = 5;

/**
 * Determines the type of array content for smart flattening
 */
type ArrayType = 'objects' | 'primitives' | 'nested' | 'mixed';

/**
 * Detects the type of content in an array
 * @param arr - Array to analyze
 * @returns ArrayType classification
 */
function detectArrayType(arr: any[]): ArrayType {
    if (arr.length === 0) return 'primitives';

    const sample = arr.slice(0, ARRAY_SAMPLE_SIZE);
    let hasObject = false;
    let hasPrimitive = false;
    let hasArray = false;

    for (const item of sample) {
        if (Array.isArray(item)) {
            hasArray = true;
        } else if (item !== null && typeof item === 'object') {
            hasObject = true;
        } else {
            hasPrimitive = true;
        }
    }

    // Nested arrays (like GeoJSON coordinates)
    if (hasArray) {
        return 'nested';
    }

    // Mixed content
    if ((hasObject && hasPrimitive) || (hasObject && hasArray) || (hasPrimitive && hasArray)) {
        return 'mixed';
    }

    // Arrays of objects (typical spreadsheet case)
    if (hasObject) {
        return 'objects';
    }

    // Arrays of primitives
    return 'primitives';
}

/**
 * Flattens nested JSON objects into spreadsheet-style rows
 * @param data - Parsed JSON data (object or array)
 * @param options - Flattening options (mode: 'flat' | 'relational')
 * @returns FlattenResult with rows and schema
 */
export function flattenJSON(data: any, options: { mode: 'flat' | 'relational' } = { mode: 'flat' }): FlattenResult {
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
        if (options.mode === 'relational') {
            const relationalResult = flattenRelational(item);
            flatRows.push(...relationalResult);
            relationalResult.forEach(row => Object.keys(row).forEach(key => allKeys.add(key)));
        } else {
            const flatRow = flattenObject(item);
            flatRows.push(flatRow);
            Object.keys(flatRow).forEach((key) => allKeys.add(key));
        }
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
 * Relational flattener: expands arrays into multiple rows
 */
function flattenRelational(obj: any, prefix: string = '', context: Record<string, any> = {}): Record<string, any>[] {
    if (obj === null || typeof obj !== 'object') {
        return [{ ...context, [prefix || 'value']: obj }];
    }

    if (Array.isArray(obj)) {
        // Smart Array Handling:
        // Only expand arrays of objects. Keep primitives/nested arrays (e.g. coordinates) compacted.
        const arrayType = detectArrayType(obj);

        if (arrayType === 'objects') {
            const results: Record<string, any>[] = [];
            obj.forEach(item => {
                results.push(...flattenRelational(item, prefix, context));
            });
            return results;
        } else {
            // Serialize primitives, nested arrays, or mixed content
            return [{ ...context, [prefix]: JSON.stringify(obj) }];
        }
    }

    // It's an object
    let currentRows: Record<string, any>[] = [{ ...context }];

    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === null || typeof value !== 'object') {
            currentRows.forEach(row => { row[newKey] = value; });
        } else if (Array.isArray(value)) {
            // Use the same smart detection for nested arrays
            const arrayType = detectArrayType(value);

            if (arrayType === 'objects' && value.length > 0) {
                // Expand logic
                const nextRows: Record<string, any>[] = [];
                currentRows.forEach(row => {
                    const expanded = flattenRelational(value, newKey, row);
                    nextRows.push(...expanded);
                });
                currentRows = nextRows;
            } else {
                // Serialize logic
                const serialized = JSON.stringify(value);
                currentRows.forEach(row => { row[newKey] = serialized; });
            }
        } else {
            // Complex value (nested object)
            const nextRows: Record<string, any>[] = [];
            currentRows.forEach(row => {
                const expanded = flattenRelational(value, newKey, row);
                nextRows.push(...expanded);
            });
            currentRows = nextRows;
        }
    }

    return currentRows;
}


/**
 * Recursively flattens a single object using dot notation with smart array handling
 * @param obj - Object to flatten
 * @param prefix - Current key prefix (for recursion)
 * @param visited - Set to track circular references
 * @param arrayDepth - Current array nesting depth
 * @returns Flattened object with dot-notation keys
 */
function flattenObject(
    obj: any,
    prefix: string = '',
    visited: Set<any> = new Set(),
    arrayDepth: number = 0
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

    // Handle arrays with smart detection
    if (Array.isArray(obj)) {
        const arrayType = detectArrayType(obj);

        // Arrays beyond max depth should be serialized
        if (arrayDepth >= MAX_ARRAY_EXPANSION_DEPTH) {
            return { [prefix]: JSON.stringify(obj) };
        }

        // Handle based on detected type
        switch (arrayType) {
            case 'objects':
                // Expand arrays of objects (typical spreadsheet case)
                obj.forEach((item, index) => {
                    const key = prefix ? `${prefix}.${index}` : `${index}`;
                    const flattened = flattenObject(item, key, new Set(visited), arrayDepth + 1);
                    Object.assign(result, flattened);
                });
                return result;

            case 'primitives':
            case 'nested':
            case 'mixed':
                // Serialize as JSON string for compact display
                return { [prefix]: JSON.stringify(obj) };

            default:
                // Fallback: serialize as JSON
                return { [prefix]: JSON.stringify(obj) };
        }
    }

    // Handle objects
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === null) {
            result[newKey] = null;
        } else if (Array.isArray(value)) {
            // STRICT FIX: Always serialize explicit primitive arrays
            // Check if ANY element is an object. If not, it's a primitive array -> Serialize.
            const hasObject = value.some(item => item !== null && typeof item === 'object');

            if (!hasObject) {
                // Format: val1, val2 (comma separated, no quotes)
                result[newKey] = value.join(', ');
            } else {
                // Determine if we should expand or serialize based on depth & type
                if (arrayDepth >= MAX_ARRAY_EXPANSION_DEPTH) {
                    result[newKey] = JSON.stringify(value);
                } else {
                    // "detectArrayType" logic:
                    // Expand ONLY if ALL items are OBJECTS but NOT ARRAYS (i.e., we serialize matrix/nested arrays)
                    const isPureObjects = value.every(item => item !== null && typeof item === 'object' && !Array.isArray(item));

                    if (isPureObjects) {
                        // Expand
                        const flattened = flattenObject(value, newKey, new Set(visited), arrayDepth);
                        Object.assign(result, flattened);
                    } else {
                        // Mixed content or Nested Arrays -> Serialize safely
                        result[newKey] = JSON.stringify(value);
                    }
                }
            }
        } else if (typeof value === 'object') {
            // Recursively flatten nested objects
            const flattened = flattenObject(value, newKey, new Set(visited), arrayDepth);
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
        // Check if value is a serialized JSON string
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
                // Try to parse it back to original structure
                const parsed = JSON.parse(value);
                const keys = key.split('.');
                let current = result;

                for (let i = 0; i < keys.length - 1; i++) {
                    const k = keys[i];
                    if (!(k in current)) {
                        current[k] = {};
                    }
                    current = current[k];
                }

                const lastKey = keys[keys.length - 1];
                current[lastKey] = parsed;
                continue;
            } catch {
                // If parsing fails, treat as regular string
            }
        }

        // Regular unflattening
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
