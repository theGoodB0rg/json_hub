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
