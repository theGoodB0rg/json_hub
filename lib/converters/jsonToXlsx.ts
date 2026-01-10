import * as XLSX from 'xlsx';

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
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-size columns based on content
    const columnWidths = schema.map((header, colIndex) => {
        const headerLength = header.length;
        const maxDataLength = Math.max(
            ...data.map((row) => {
                const value = row[header];
                return value !== null && value !== undefined
                    ? String(value).length
                    : 0;
            })
        );
        return { wch: Math.max(headerLength, maxDataLength, 10) };
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    return workbook;
}

/**
 * Downloads Excel file
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @param filename - Output filename
 */
export function downloadXlsx(
    data: Record<string, any>[],
    schema: string[],
    filename: string = 'export.xlsx'
): void {
    const workbook = jsonToXlsx(data, schema);
    XLSX.writeFile(workbook, filename);
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
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nested Data');
    return workbook;
}

/**
 * Downloads Hierarchical Excel file
 */
export function downloadXlsxHierarchical(
    data: any,
    filename: string = 'nested-export.xlsx'
): void {
    const workbook = jsonToXlsxHierarchical(data);
    XLSX.writeFile(workbook, filename);
}
