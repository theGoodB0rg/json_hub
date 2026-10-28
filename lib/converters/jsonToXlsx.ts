import * as XLSX from 'xlsx';
import { appendSheet, buildSheet, writeXlsx } from './xlsxWriter';

/**
 * Converts flat JSON data to Excel format
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @returns Excel workbook
 */
export function jsonToXlsx(
    data: Record<string, any>[],
    schema: string[]
): XLSX.WorkBook {
    // Create worksheet data with headers
    const worksheetData = [
        schema, // Header row
        ...data.map((row) => schema.map((col) => row[col] ?? null)),
    ];

    // Create worksheet
    const { worksheet, report } = buildSheet(worksheetData);

    // Auto-size columns based on content
    const columnWidths = schema.map((header, colIndex) => {
        const headerLength = header.length;
        // A loop, not Math.max(...spread): spreading hundreds of thousands of
        // rows overflows the call stack. Width is capped at Excel's own max (255).
        let maxDataLength = 0;
        for (const row of data) {
            const value = row[header];
            if (value === null || value === undefined) continue;
            const len = String(value).length;
            if (len > maxDataLength) maxDataLength = len;
        }
        return { wch: Math.min(Math.max(headerLength, maxDataLength, 10), 255) };
    });

    worksheet['!cols'] = columnWidths;

    // Apply header styling
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
            worksheet[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: 'E0E0E0' } },
            };
        }
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    appendSheet(workbook, worksheet, 'Data', report);

    return workbook;
}

/**
 * Downloads Excel file
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @param filename - Output filename
 */
export async function downloadXlsx(
    data: Record<string, any>[],
    schema: string[],
    filename: string = 'export.xlsx'
) {
    const workbook = jsonToXlsx(data, schema);
    const bytes = writeXlsx(workbook);
    const { saveWithDialog } = await import('@/lib/platform/downloadHelper');
    return saveWithDialog(
        bytes,
        filename,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
}


// --- Hierarchical Export ---

/**
 * Converts any JSON data to a hierarchical Excel format with merged cells
 * @param data - Any JSON data (object or array)
 * @returns Excel workbook
 */
export function jsonToXlsxHierarchical(data: any): XLSX.WorkBook {
    const rows: any[][] = [];
    const merges: XLSX.Range[] = [];
    let currentRow = 0;

    // Helper to check if value is primitive
    const isPrimitive = (val: any) => val === null || typeof val !== 'object';

    /**
     * Recursive function to build grid
     * @param key - Current key (or index)
     * @param value - Current value
     * @param depth - Current column depth
     */
    function processNode(key: string | null, value: any, depth: number) {
        const startRow = currentRow;

        // If it's the very root call and we have an array/object, 
        // we might want to skip printing the "row 0" key if it's null, 
        // to avoid an empty first column if we passed null as key.
        // But consistent recursion uses (key) -> processing.

        // Determine if we write the key
        if (key !== null) {
            if (!rows[currentRow]) rows[currentRow] = [];
            rows[currentRow][depth] = key;
        }

        const valueCol = key !== null ? depth + 1 : depth;

        if (isPrimitive(value)) {
            if (!rows[currentRow]) rows[currentRow] = [];
            rows[currentRow][valueCol] = value;
            currentRow++;
            return;
        }

        // Complex value (Object or Array)
        // Check for primitive array first
        if (Array.isArray(value)) {
            const hasObject = value.some(item => item !== null && typeof item === 'object');
            if (!hasObject) {
                // Format: val1, val2 (no quotes)
                const formatted = value.join(', ');
                if (!rows[currentRow]) rows[currentRow] = [];
                rows[currentRow][valueCol] = formatted;
                currentRow++;
                return;
            }
        }

        const entries = Array.isArray(value)
            ? value.map((v, i) => [String(i), v])
            : Object.entries(value);

        if (entries.length === 0) {
            // Empty object/array
            if (!rows[currentRow]) rows[currentRow] = [];
            rows[currentRow][valueCol] = Array.isArray(value) ? '[]' : '{}';
            currentRow++;
            return;
        }

        // Recurse children
        entries.forEach(([childKey, childValue]) => {
            processNode(childKey, childValue, valueCol);
        });

        // Add merge if this node spanned multiple rows
        const endRow = currentRow - 1;
        if (key !== null && endRow > startRow) {
            merges.push({
                s: { r: startRow, c: depth },
                e: { r: endRow, c: depth },
            });
        }
    }

    // Start recursion
    // If data is array (common root), we treat indices as top level keys
    // If data is object, keys are top level
    // We pass null as key to indicate root level, so children start at depth 0
    processNode(null, data, 0);

    // Create Sheets
    const { worksheet, report } = buildSheet(rows);
    worksheet['!merges'] = merges;

    // Auto-size columns (simple heuristic)
    // We can't rely on simple 'schema' here because columns are dynamic depth
    const maxCol = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const cols = [];
    for (let c = 0; c < maxCol; c++) {
        // Calculate max width for this column
        let maxWidth = 10;
        for (let r = 0; r < rows.length; r++) {
            const cellVal = rows[r] ? rows[r][c] : null;
            if (cellVal) {
                const len = String(cellVal).length;
                if (len > maxWidth) maxWidth = len;
            }
        }
        // Cap width to avoid super wide columns
        cols.push({ wch: Math.min(maxWidth, 50) });
    }
    worksheet['!cols'] = cols;

    // Apply some styling - Align Top Vertical
    // This makes merged cells look better (text at top instead of centered vertically)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            if (!worksheet[addr]) continue;

            if (!worksheet[addr].s) worksheet[addr].s = {};

            // Vertical align top
            worksheet[addr].s.alignment = { vertical: 'top', horizontal: 'left' };

            // Add border for clarity
            worksheet[addr].s.border = {
                top: { style: 'thin', color: { rgb: "E0E0E0" } },
                bottom: { style: 'thin', color: { rgb: "E0E0E0" } },
                left: { style: 'thin', color: { rgb: "E0E0E0" } },
                right: { style: 'thin', color: { rgb: "E0E0E0" } }
            };
        }
    }

    const workbook = XLSX.utils.book_new();
    appendSheet(workbook, worksheet, 'Nested Data', report);
    return workbook;
}

/**
 * Downloads Hierarchical Excel file
 */
export async function downloadXlsxHierarchical(
    data: any,
    filename: string = 'nested-export.xlsx'
) {
    const workbook = jsonToXlsxHierarchical(data);
    const bytes = writeXlsx(workbook);
    const { saveWithDialog } = await import('@/lib/platform/downloadHelper');
    return saveWithDialog(
        bytes,
        filename,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
}
