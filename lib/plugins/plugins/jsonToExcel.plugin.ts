import type { ConverterPlugin, ConversionResult, ExportResult, DataFormat } from '@/types/converter.types';
import { validateAndParse } from '@/lib/parsers/smartParse';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import { jsonToXlsx } from '@/lib/converters/jsonToXlsx';

import * as XLSX from 'xlsx';

export const jsonToExcelPlugin: ConverterPlugin = {
    id: 'json-to-excel',
    name: 'JSON to Excel Converter',
    sourceFormat: 'json',
    targetFormat: 'xlsx',
    uiConfig: {
        inputTitle: 'Paste or Drop JSON Data',
        inputPlaceholder: '{\n  "users": [\n    { "id": 1, "name": "Alice" }\n  ]\n}',
        dropzoneText: 'Drag & drop JSON files here (.json)',
        dropzoneAcceptedExtensions: ['.json'],
        defaultSample: '[\n  {\n    "id": 1,\n    "name": "Jane Doe",\n    "email": "jane@example.com",\n    "role": "Admin",\n    "active": true\n  },\n  {\n    "id": 2,\n    "name": "Alex Smith",\n    "email": "alex@example.com",\n    "role": "Developer",\n    "active": false\n  }\n]',
        primaryActionLabel: 'Export to Excel',
        availableExportFormats: ['xlsx', 'csv', 'html', 'docx', 'zip'],
        defaultExportFormat: 'xlsx',
        outputMode: 'table',
        badgeText: 'Smart Flattening',
        iconName: 'FileSpreadsheet',
    },
    validate(input: string) {
        const result = validateAndParse(input);
        return {
            valid: result.success,
            errors: result.errors,
        };
    },
    parse(input: string, options?: any): ConversionResult {
        const parseRes = validateAndParse(input);
        if (!parseRes.success || !parseRes.data) {
            return {
                success: false,
                errors: parseRes.errors,
                flatData: [],
                schema: [],
            };
        }

        const unwrapped = smartUnwrap(parseRes.data);
        const flattened = flattenJSON(unwrapped.data, options);

        return {
            success: true,
            data: parseRes.data,
            flatData: flattened.rows,
            schema: flattened.schema,
            formattedOutput: JSON.stringify(parseRes.data, null, 2),
        };
    },
    export(data: any, format: DataFormat, options?: any): ExportResult {
        if (format === 'xlsx') {
            const schema = options?.schema || Object.keys(data[0] || {});
            const wb = jsonToXlsx(data, schema);
            const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([arrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            return {
                blob,
                filename: `export_${Date.now()}.xlsx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        return {
            content: JSON.stringify(data, null, 2),
            filename: `export_${Date.now()}.json`,
            mimeType: 'application/json',
        };
    },
};
