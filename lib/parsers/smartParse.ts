import type { ParseResult, ParseError } from '@/types/parser.types';

const MAX_RECURSION_DEPTH = 10;

/**
 * Validates and parses JSON with automatic unescaping for double/triple-encoded strings
 * @param input - Raw JSON string to parse
 * @param depth - Current recursion depth (internal use)
 * @returns ParseResult with success status, data, or errors
 */
export function validateAndParse(
    input: string,
    depth: number = 0
): ParseResult {
    // Prevent infinite recursion
    if (depth >= MAX_RECURSION_DEPTH) {
        return {
            success: false,
            errors: [
                {
                    message: `Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded. Possible circular reference or deeply nested encoding.`,
                },
            ],
        };
    }

    // Handle empty input
    if (!input || input.trim() === '') {
        return {
            success: false,
            errors: [{ message: 'Input is empty' }],
        };
    }

    // Files saved by Excel, Notepad and PowerShell on Windows often start
    // with a UTF-8 byte-order mark, which JSON.parse rejects outright.
    if (input.charCodeAt(0) === 0xfeff) {
        input = input.slice(1);
    }

    try {
        // Attempt to parse JSON
        const parsed = JSON.parse(input);

        // Check if result is a string (double-encoded JSON)
        if (typeof parsed === 'string') {
            // Try to parse the string to see if it's encoded JSON
            try {
                JSON.parse(parsed);
                // If parsing succeeds, this is likely encoded JSON
                // Recursively parse again (auto-unescape)
                return validateAndParse(parsed, depth + 1);
            } catch {
                // If parsing fails, this is just a regular string value
                // Return it as-is
            }
        }

        // No circular-reference check: JSON.parse cannot produce cycles, and
        // re-stringifying the whole document doubled peak memory on large files.

        // Success - return parsed data as-is
        // Note: Previously we wrapped single objects in arrays here, but this caused issues
        // with Table View. Now smartUnwrap handles all wrapper detection consistently.
        return {
            success: true,
            data: parsed,
        };
    } catch (error) {
        // JSON Lines (one object per line), common in log and database
        // exports, is not a single JSON document but is unambiguous to read.
        const jsonLines = parseJsonLines(input);
        if (jsonLines) {
            return { success: true, data: jsonLines };
        }

        const errors: ParseError[] = [];

        // Get error message
        let errorMessage = 'Invalid JSON';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        const hint = describeNonJsonInput(input);
        if (hint) {
            errorMessage = `${hint} (${errorMessage})`;
        }

        // Extract line and column information if available
        const lineMatch = errorMessage.match(/line (\d+)/i);
        const columnMatch = errorMessage.match(/column (\d+)/i);

        errors.push({
            message: errorMessage,
            line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
            column: columnMatch ? parseInt(columnMatch[1], 10) : undefined,
        });

        return {
            success: false,
            errors,
        };
    }
}

/**
 * Parses newline-delimited JSON. Returns null unless there are at least two
 * non-empty lines and every one of them is a JSON object or array, so plain
 * invalid JSON is never misread as JSON Lines.
 */
export function parseJsonLines(input: string): unknown[] | null {
    const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return null;

    const rows: unknown[] = [];
    for (const line of lines) {
        if (line[0] !== '{' && line[0] !== '[') return null;
        try {
            rows.push(JSON.parse(line));
        } catch {
            return null;
        }
    }
    return rows;
}

/**
 * Names the format when the input is recognisably something other than JSON,
 * so the user is told what to do instead of seeing a bare syntax error.
 */
export function describeNonJsonInput(input: string): string | null {
    const head = input.trimStart().slice(0, 200);
    if (/^<!doctype html|^<html[\s>]/i.test(head)) {
        return 'This looks like an HTML page, not JSON. Save the JSON response itself, not the web page.';
    }
    if (/^<\?xml|^<[a-zA-Z][\w:-]*[\s>]/.test(head)) {
        return 'This looks like XML, not JSON. Use the XML to Excel converter instead.';
    }
    const firstLine = head.split(/\r?\n/)[0];
    if (!/^[[{"]/.test(firstLine) && /[,;\t]/.test(firstLine) && /\r?\n/.test(input.trim())) {
        return 'This looks like CSV or a spreadsheet export, not JSON. Use the CSV converter instead.';
    }
    return null;
}

/**
 * Checks if a value is valid JSON
 * @param input - String to validate
 * @returns boolean indicating if input is valid JSON
 */
export function isValidJSON(input: string): boolean {
    const result = validateAndParse(input);
    return result.success;
}

/**
 * Counts the nesting depth of encoded JSON strings
 * @param input - JSON string to analyze
 * @returns number of encoding levels
 */
export function getEncodingDepth(input: string): number {
    let depth = 0;
    let current = input;

    while (depth < MAX_RECURSION_DEPTH) {
        try {
            const parsed = JSON.parse(current);
            if (typeof parsed === 'string') {
                depth++;
                current = parsed;
            } else {
                break;
            }
        } catch {
            break;
        }
    }

    return depth;
}
