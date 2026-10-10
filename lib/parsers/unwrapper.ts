
/**
 * Smart Unwrapper
 * Detects if a JSON object is just a wrapper around a significant array
 * and extracts that array for better tabular visualization.
 */

import { matchPlatform } from '@/lib/parsers/platform';
import type { FlattenMode } from '@/lib/parsers/platform/types';

interface UnwrapResult {
    data: any | any[];
    isUnwrapped: boolean;
    wrapperInfo?: Record<string, any>; // properties that were stripped
}

const COMMON_DATA_KEYS = new Set([
    'data',
    'items',
    'results',
    'features',
    'records',
    'rows',
    'list',
    'content',
    'payload'
]);

/**
 * @param mode  Row grain to request from a platform parser. This has to be
 *              threaded through because the canonical pipeline is
 *              `smartUnwrap(data)` → `flattenJSON(data, { mode })`: by the
 *              time flattenJSON sees the payload a platform parser has
 *              already chosen the grain, so passing the mode only to
 *              flattenJSON left the relational path unreachable.
 */
export function smartUnwrap(data: any, mode: FlattenMode = 'flat'): UnwrapResult {
    // Check for specialized platform exports (Trello, Jira, ...). Registered
    // in lib/parsers/platform — adding one there wires up both this call site
    // and flattenJSON.
    const platform = matchPlatform(data, mode);
    if (platform) {
        return {
            data: platform.rows,
            isUnwrapped: true,
        };
    }

    // Handle single-element arrays containing wrapper objects
    // This handles cases where data is wrapped like [{ records: [...] }]
    if (Array.isArray(data) && data.length === 1) {
        const singleElement = data[0];
        if (singleElement && typeof singleElement === 'object' && !Array.isArray(singleElement)) {
            // Recursively try to unwrap the single element
            const innerResult = smartUnwrap(singleElement, mode);
            if (innerResult.isUnwrapped) {
                return innerResult;
            }
        }
    }

    // If it's already an array (multi-element or couldn't unwrap single), nothing more to do
    if (Array.isArray(data)) {
        return { data, isUnwrapped: false };
    }

    // If primitive or null, can't unwrap
    if (data === null || typeof data !== 'object') {
        return { data, isUnwrapped: false };
    }

    // Get all keys and array keys
    const entries = Object.entries(data);
    const arrayEntries = entries.filter(([_, value]) => Array.isArray(value));

    // If no arrays, can't unwrap
    if (arrayEntries.length === 0) {
        return { data, isUnwrapped: false };
    }

    let targetKey: string | null = null;

    // Strategy 1: exact match with common keys
    for (const [key] of arrayEntries) {
        if (COMMON_DATA_KEYS.has(key.toLowerCase())) {
            targetKey = key;
            break;
        }
    }

    // Strategy 2: If only one array and it has content, use it
    if (!targetKey && arrayEntries.length === 1) {
        targetKey = arrayEntries[0][0];
    }

    // Strategy 3: Largest array if multiple
    if (!targetKey && arrayEntries.length > 1) {
        targetKey = arrayEntries.reduce((maxKey, current) => {
            const maxLen = (data[maxKey] as any[]).length;
            const currLen = (current[1] as any[]).length;
            return currLen > maxLen ? current[0] : maxKey;
        }, arrayEntries[0][0]);
    }

    if (targetKey) {
        const unwrappedData = data[targetKey] as any[];

        // Don't unwrap empty arrays unless it's a known data key
        if (unwrappedData.length === 0 && !COMMON_DATA_KEYS.has(targetKey.toLowerCase())) {
            return { data, isUnwrapped: false };
        }

        // Collect wrapper info (everything except the target key)
        const wrapperInfo: Record<string, any> = {};
        entries.forEach(([key, value]) => {
            if (key !== targetKey) {
                // If value is too large/complex, simplify it
                if (typeof value === 'object' && value !== null) {
                    wrapperInfo[key] = JSON.stringify(value);
                } else {
                    wrapperInfo[key] = value;
                }
            }
        });

        return {
            data: unwrappedData,
            isUnwrapped: true,
            wrapperInfo
        };
    }

    return { data, isUnwrapped: false };
}
