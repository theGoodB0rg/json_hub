import JSZip from 'jszip';
import { jsonToCsv } from './jsonToCsv';
import { jsonToXlsx } from './jsonToXlsx';
import { jsonToHtml } from './jsonToHtml';
import * as XLSX from 'xlsx';

/**
 * Creates a ZIP file containing all export formats
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @param parsedData - Original parsed JSON data
 * @returns Promise<Blob> - ZIP file blob
 */
export async function createZipExport(
    data: Record<string, any>[],
    schema: string[],
    parsedData: any
): Promise<Blob> {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    // Add CSV
    const csvContent = jsonToCsv(data, schema);
    zip.file(`export-${timestamp}.csv`, csvContent);

    // Add Excel
    const workbook = jsonToXlsx(data, schema);
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    zip.file(`export-${timestamp}.xlsx`, excelBuffer);

    // Add HTML
    const htmlContent = jsonToHtml(data, schema);
    zip.file(`export-${timestamp}.html`, htmlContent);

    // Add original JSON (pretty-printed)
    const jsonContent = JSON.stringify(parsedData, null, 2);
    zip.file(`export-${timestamp}.json`, jsonContent);

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
}

/**
 * Downloads ZIP file containing all formats
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @param parsedData - Original parsed JSON data
 * @param filename - Output filename
 */
export async function downloadZip(
    data: Record<string, any>[],
    schema: string[],
    parsedData: any,
    filename: string = 'json-hub-export.zip'
): Promise<void> {
    const zipBlob = await createZipExport(data, schema, parsedData);
    const url = URL.createObjectURL(zipBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
