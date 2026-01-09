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
 * Downloads CSV file
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @param filename - Output filename
 */
export function downloadCsv(
    data: Record<string, any>[],
    schema: string[],
    filename: string = 'export.csv'
): void {
    const csvContent = jsonToCsv(data, schema);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
