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

        // Check for circular references by attempting to stringify
        try {
            JSON.stringify(parsed);
        } catch (stringifyError) {
            return {
                success: false,
                errors: [
                    {
                        message: 'Circular reference detected in JSON structure',
                    },
                ],
            };
        }

        // Success - return parsed data
        return {
            success: true,
            data: parsed,
        };
    } catch (error) {
        const errors: ParseError[] = [];

        // Get error message
        let errorMessage = 'Invalid JSON';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
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
