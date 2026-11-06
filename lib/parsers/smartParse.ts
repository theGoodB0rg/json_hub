import type { ParseResult, ParseError } from '@/types/parser.types';
import { escapeControlCharsInStrings } from './controlChars';

export { escapeControlCharsInStrings };

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

        // Several documents saved one after another — pretty-printed API
        // responses, or pages of results appended to one file. Telemetry shows
        // these failing at "line N column 1" right after a complete value.
        const documents = parseConcatenatedJson(input);
        if (documents) {
            return { success: true, data: documents };
        }

        // Get error message
        let errorMessage = 'Invalid JSON';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        // Raw tabs and line breaks inside strings (common in exported logs
        // and descriptions) are invalid JSON but unambiguous to repair.
        if (/bad control character/i.test(errorMessage)) {
            const repaired = escapeControlCharsInStrings(input);
            if (repaired !== null) {
                const retry = validateAndParse(repaired, depth + 1);
                if (retry.success) return retry;
            }
        }

        const errors: ParseError[] = [];

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
    return joinDocuments(rows);
}

/**
 * Combines several top-level JSON values into one list of rows. An array of
 * records (a page of API results) contributes its records; any other array —
 * a row of values like ["bob", 3] — stays a single row.
 */
function joinDocuments(values: unknown[]): unknown[] {
    const isRecordPage = (v: unknown) =>
        Array.isArray(v) &&
        v.length > 0 &&
        v.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item));
    const rows: unknown[] = [];
    for (const value of values) {
        if (isRecordPage(value)) rows.push(...(value as unknown[]));
        else rows.push(value);
    }
    return rows;
}

/**
 * Splits input made of two or more top-level JSON objects/arrays written one
 * after another (optionally comma-separated) and parses each. Objects become
 * records; arrays of records contribute their items, so paginated responses
 * join up.
 * Returns null unless every piece is a valid object or array, so ordinary
 * invalid JSON is never misread.
 */
export function parseConcatenatedJson(input: string): unknown[] | null {
    const pieces: string[] = [];
    let depth = 0;
    let inString = false;
    let escaped = false;
    let start = -1;

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            if (depth === 0) return null; // a bare top-level string
            inString = true;
        } else if (ch === '{' || ch === '[') {
            if (depth === 0) start = i;
            depth++;
        } else if (ch === '}' || ch === ']') {
            depth--;
            if (depth < 0) return null;
            if (depth === 0) pieces.push(input.slice(start, i + 1));
        } else if (depth === 0 && ch !== ',' && !/\s/.test(ch)) {
            return null; // anything else between documents
        }
    }
    if (depth !== 0 || pieces.length < 2) return null;

    const values: unknown[] = [];
    for (const piece of pieces) {
        try {
            values.push(JSON.parse(piece));
        } catch {
            return null;
        }
    }
    return joinDocuments(values);
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
