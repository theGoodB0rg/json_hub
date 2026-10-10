/**
 * Converts flat JSON data to CSV format
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @returns CSV string
 */
export function jsonToCsv(
    data: Record<string, any>[],
    schema: string[]
): string {
    if (data.length === 0 || schema.length === 0) {
        return '';
    }

    // Helper to escape CSV values
    const escapeCsvValue = (value: any): string => {
        if (value === null || value === undefined) {
            return '';
        }

        const stringValue = String(value);

        // Check if value needs escaping (contains comma, quote, or newline)
        if (
            stringValue.includes(',') ||
            stringValue.includes('"') ||
            stringValue.includes('\n') ||
            stringValue.includes('\r')
        ) {
            // Escape quotes by doubling them and wrap in quotes
            return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    };

    // Create header row
    const headerRow = schema.map(escapeCsvValue).join(',');

    // Create data rows
    const dataRows = data.map((row) => {
        return schema.map((column) => escapeCsvValue(row[column])).join(',');
    });

    // Combine header and data with UTF-8 BOM for Excel compatibility
    const csvContent = [headerRow, ...dataRows].join('\n');
    return '\uFEFF' + csvContent; // UTF-8 BOM
}

/**
 * Save CSV to disk. On desktop opens the native Save As dialog; on web
 * triggers a browser download. Returns a SaveResult so callers can show
 * a "Reveal in folder" toast on desktop.
 */
export async function downloadCsv(
    data: Record<string, any>[],
    schema: string[],
    filename: string = 'export.csv'
) {
    const csvContent = jsonToCsv(data, schema);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const { saveWithDialog } = await import('@/lib/platform/downloadHelper');
    return saveWithDialog(blob, filename, 'text/csv;charset=utf-8');
}
