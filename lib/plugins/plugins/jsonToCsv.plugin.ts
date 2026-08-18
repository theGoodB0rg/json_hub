import type { ConverterPlugin, ConversionResult, ExportResult, DataFormat } from '@/types/converter.types';
import { validateAndParse } from '@/lib/parsers/smartParse';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import { jsonToCsv } from '@/lib/converters/jsonToCsv';

export const jsonToCsvPlugin: ConverterPlugin = {
    id: 'json-to-csv',
    name: 'JSON to CSV Converter',
    sourceFormat: 'json',
    targetFormat: 'csv',
    uiConfig: {
        inputTitle: 'Paste or Drop JSON Data',
        inputPlaceholder: '[\n  { "id": 1, "product": "Widget", "price": 19.99 }\n]',
        dropzoneText: 'Drag & drop JSON files here (.json)',
        dropzoneAcceptedExtensions: ['.json'],
        defaultSample: '[\n  {\n    "id": "PROD-001",\n    "name": "Mechanical Keyboard",\n    "category": "Electronics",\n    "inStock": true,\n    "price": 89.99\n  },\n  {\n    "id": "PROD-002",\n    "name": "Wireless Mouse",\n    "category": "Electronics",\n    "inStock": false,\n    "price": 39.99\n  }\n]',
        primaryActionLabel: 'Export to CSV',
        availableExportFormats: ['csv', 'xlsx', 'html'],
        defaultExportFormat: 'csv',
        outputMode: 'table',
        badgeText: 'Instant CSV Export',
        iconName: 'FileText',
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
        const schema = options?.schema || (data[0] ? Object.keys(data[0]) : []);
        const csvString = jsonToCsv(data, schema);
        return {
            content: csvString,
            filename: `export_${Date.now()}.csv`,
            mimeType: 'text/csv;charset=utf-8;',
        };
    },
};
