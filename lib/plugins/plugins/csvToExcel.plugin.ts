import type { ConverterPlugin, ConversionResult, ExportResult, DataFormat } from '@/types/converter.types';
import { parseCsvToJson } from '@/lib/parsers/csv/csvParser';
import { jsonToXlsx } from '@/lib/converters/jsonToXlsx';
import { jsonToCsv } from '@/lib/converters/jsonToCsv';

import * as XLSX from 'xlsx';

export const csvToExcelPlugin: ConverterPlugin = {
    id: 'csv-to-excel',
    name: 'CSV to Excel Converter',
    sourceFormat: 'csv',
    targetFormat: 'xlsx',
    uiConfig: {
        inputTitle: 'Paste or Drop CSV / TSV File',
        inputPlaceholder: 'Date,Transaction,Amount,Status\n2024-01-15,Payment #1029,450.00,Completed',
        dropzoneText: 'Drag & drop CSV, TSV or TXT files (.csv, .tsv, .txt)',
        dropzoneAcceptedExtensions: ['.csv', '.tsv', '.txt'],
        defaultSample: 'InvoiceID,Customer,Date,Amount,Currency,Status\nINV-2024-001,Acme Corp,2024-01-10,1250.00,USD,Paid\nINV-2024-002,Global Logistics,2024-01-12,3420.50,USD,Pending\nINV-2024-003,Starlight Tech,2024-01-14,890.00,EUR,Paid',
        primaryActionLabel: 'Export to Excel',
        availableExportFormats: ['xlsx', 'csv', 'html', 'json'],
        defaultExportFormat: 'xlsx',
        outputMode: 'table',
        badgeText: 'Preserves Data Types & Formats',
        iconName: 'FileSpreadsheet',
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
    export(data: any, format: DataFormat, options?: any): ExportResult {
        const schema = options?.schema || (data[0] ? Object.keys(data[0]) : []);
        if (format === 'xlsx') {
            const wb = jsonToXlsx(data, schema);
            const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([arrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            return {
                blob,
                filename: `csv_to_excel_${Date.now()}.xlsx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (format === 'csv') {
            const csv = jsonToCsv(data, schema);
            return {
                content: csv,
                filename: `csv_export_${Date.now()}.csv`,
                mimeType: 'text/csv;charset=utf-8;',
            };
        }
        return {
            content: JSON.stringify(data, null, 2),
            filename: `csv_export_${Date.now()}.json`,
            mimeType: 'application/json',
        };
    },
};
