import type { ConverterPlugin, ConversionResult, ExportResult, DataFormat } from '@/types/converter.types';
import { parseCsvToJson } from '@/lib/parsers/csv/csvParser';

export const csvToJsonPlugin: ConverterPlugin = {
    id: 'csv-to-json',
    name: 'CSV to JSON Converter',
    sourceFormat: 'csv',
    targetFormat: 'json',
    uiConfig: {
        inputTitle: 'Paste or Drop CSV / TSV Data',
        inputPlaceholder: 'id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com',
        dropzoneText: 'Drag & drop CSV or TSV files here (.csv, .tsv, .txt)',
        dropzoneAcceptedExtensions: ['.csv', '.tsv', '.txt'],
        defaultSample: 'id,name,role,active,salary\n101,Sarah Connor,Engineer,true,120000\n102,John Doe,Designer,false,95000\n103,Alex Murphy,Security,true,110000',
        primaryActionLabel: 'Convert to JSON',
        availableExportFormats: ['json', 'csv'],
        defaultExportFormat: 'json',
        outputMode: 'code',
        badgeText: 'RFC-4180 Validated',
        iconName: 'FileJson',
    },
    validate(input: string) {
        if (!input || input.trim() === '') {
            return { valid: false, errors: [{ message: 'Input is empty' }] };
        }
        return { valid: true };
    },
    parse(input: string, options?: any): ConversionResult {
        return parseCsvToJson(input, options);
    },
    export(data: any, format: DataFormat): ExportResult {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        return {
            content,
            filename: `converted_${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`,
            mimeType: format === 'csv' ? 'text/csv' : 'application/json',
        };
    },
};
