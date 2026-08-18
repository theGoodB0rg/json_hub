import type { ConversionResult, ParseOptions, ParseError } from '@/types/converter.types';

/**
 * Auto-detects the most likely delimiter from a CSV string sample.
 */
export function detectDelimiter(text: string): string {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
    if (lines.length === 0) return ',';

    const candidates = [',', ';', '\t', '|'];
    const counts: Record<string, number[]> = {
        ',': [],
        ';': [],
        '\t': [],
        '|': [],
    };

    for (const line of lines) {
        let inQuotes = false;
        const lineCounts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (!inQuotes && candidates.includes(char)) {
                lineCounts[char]++;
            }
        }

        for (const c of candidates) {
            counts[c].push(lineCounts[c]);
        }
    }

    // Find delimiter with highest and most consistent count across lines
    let bestDelimiter = ',';
    let maxScore = -1;

    for (const c of candidates) {
        const rowCounts = counts[c];
        if (rowCounts.length === 0) continue;
        const total = rowCounts.reduce((a, b) => a + b, 0);
        if (total === 0) continue;

        const avg = total / rowCounts.length;
        // Variance to check consistency
        const variance = rowCounts.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / rowCounts.length;
        const consistencyBonus = variance === 0 ? 2 : 1 / (1 + variance);
        const score = total * consistencyBonus;

        if (score > maxScore) {
            maxScore = score;
            bestDelimiter = c;
        }
    }

    return bestDelimiter;
}

/**
 * Parses raw CSV/TSV string into a 2D array of tokens adhering to RFC-4180.
 */
export function tokenizeCsv(input: string, delimiter: string = ','): { rows: string[][]; errors: ParseError[] } {
    const rows: string[][] = [];
    const errors: ParseError[] = [];
    
    if (!input || input.trim() === '') {
        return { rows, errors };
    }

    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let lineNum = 1;
    let colNum = 1;

    let i = 0;
    const len = input.length;

    while (i < len) {
        const char = input[i];
        const nextChar = i + 1 < len ? input[i + 1] : '';

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    currentCell += '"';
                    i += 2;
                    colNum += 2;
                    continue;
                } else {
                    // Closing quote
                    inQuotes = false;
                    i++;
                    colNum++;
                    continue;
                }
            } else {
                if (char === '\n') {
                    lineNum++;
                    colNum = 1;
                } else {
                    colNum++;
                }
                currentCell += char;
                i++;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
                i++;
                colNum++;
            } else if (input.startsWith(delimiter, i)) {
                currentRow.push(currentCell);
                currentCell = '';
                i += delimiter.length;
                colNum += delimiter.length;
            } else if (char === '\r' && nextChar === '\n') {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
                i += 2;
                lineNum++;
                colNum = 1;
            } else if (char === '\n' || char === '\r') {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
                i++;
                lineNum++;
                colNum = 1;
            } else {
                currentCell += char;
                i++;
                colNum++;
            }
        }
    }

    // Flush remaining cell and row
    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    if (inQuotes) {
        errors.push({
            message: 'Unclosed quote detected at end of CSV input',
            line: lineNum,
            column: colNum,
        });
    }

    return { rows, errors };
}

/**
 * Infers and casts string values into proper primitives (number, boolean, null, object).
 */
export function inferValue(val: string, inferTypes: boolean = true): any {
    if (!inferTypes) return val;
    const trimmed = val.trim();
    if (trimmed === '') return '';
    if (trimmed.toLowerCase() === 'null') return null;
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Number check: ensure it's not a phone number or leading-zero code unless single '0'
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        if (trimmed.length > 1 && trimmed.startsWith('0') && !trimmed.startsWith('0.')) {
            return trimmed; // Retain leading zeroes as string (e.g. zip codes '01234')
        }
        const num = Number(trimmed);
        if (!isNaN(num)) return num;
    }

    // JSON embedded object/array check (e.g. Jira multi-values or Shopify properties)
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // Keep as string if invalid JSON
        }
    }

    return val;
}

/**
 * Deduplicates headers to guarantee unique keys.
 */
function deduplicateHeaders(headers: string[]): string[] {
    const seen: Record<string, number> = {};
    return headers.map((header, idx) => {
        let clean = header.trim() || `column_${idx + 1}`;
        if (seen[clean] !== undefined) {
            seen[clean]++;
            return `${clean}_${seen[clean]}`;
        }
        seen[clean] = 0;
        return clean;
    });
}

/**
 * Parses CSV/TSV input into tabular records and formatted JSON.
 */
export function parseCsvToJson(input: string, options: ParseOptions = {}): ConversionResult {
    if (!input || input.trim() === '') {
        return {
            success: false,
            errors: [{ message: 'Input is empty' }],
            flatData: [],
            schema: [],
        };
    }

    const delimiter = options.delimiter || detectDelimiter(input);
    const inferTypes = options.inferTypes !== false;

    const { rows, errors } = tokenizeCsv(input, delimiter);

    if (errors.length > 0 && rows.length === 0) {
        return {
            success: false,
            errors,
            flatData: [],
            schema: [],
        };
    }

    // Filter out completely empty rows
    const nonEmptyRows = rows.filter((r) => r.some((c) => c.trim().length > 0));

    if (nonEmptyRows.length === 0) {
        return {
            success: false,
            errors: [{ message: 'No tabular data rows found' }],
            flatData: [],
            schema: [],
        };
    }

    const rawHeaders = nonEmptyRows[0];
    const schema = deduplicateHeaders(rawHeaders);
    const dataRows = nonEmptyRows.slice(1);

    const records: Record<string, any>[] = [];

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        if (options.maxRows && rowIndex >= options.maxRows) break;
        const row = dataRows[rowIndex];
        const record: Record<string, any> = {};

        schema.forEach((colName, colIdx) => {
            const rawVal = colIdx < row.length ? row[colIdx] : '';
            record[colName] = inferValue(rawVal, inferTypes);
        });

        records.push(record);
    }

    const formattedOutput = JSON.stringify(records, null, 2);

    return {
        success: true,
        data: records,
        flatData: records,
        schema,
        formattedOutput,
        errors: errors.length > 0 ? errors : undefined,
    };
}
