import { saveWithDialog } from '@/lib/platform/downloadHelper';
import { jsonToCsv } from './csvCore';

export { jsonToCsv };

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
    return saveWithDialog(blob, filename, 'text/csv;charset=utf-8');
}
