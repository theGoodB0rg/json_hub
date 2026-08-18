import type { ConverterPlugin, ConversionResult, ExportResult, DataFormat } from '@/types/converter.types';
import { parseXml } from '@/lib/parsers/xml/xmlParser';
import { jsonToXlsx } from '@/lib/converters/jsonToXlsx';
import { jsonToCsv } from '@/lib/converters/jsonToCsv';

import * as XLSX from 'xlsx';

export const xmlToExcelPlugin: ConverterPlugin = {
    id: 'xml-to-excel',
    name: 'XML to Excel Converter',
    sourceFormat: 'xml',
    targetFormat: 'xlsx',
    uiConfig: {
        inputTitle: 'Paste or Drop XML Document',
        inputPlaceholder: '<catalog>\n  <item id="101">\n    <name>Widget</name>\n    <price>19.99</price>\n  </item>\n</catalog>',
        dropzoneText: 'Drag & drop XML files here (.xml, .rss, .atom, .svg)',
        dropzoneAcceptedExtensions: ['.xml', '.rss', '.atom', '.svg', '.txt'],
        defaultSample: '<?xml version="1.0" encoding="UTF-8"?>\n<inventory company="Acme Corp">\n  <product sku="ACME-01" inStock="true">\n    <title>Anvil Heavy Duty</title>\n    <category>Tools</category>\n    <price>149.99</price>\n    <supplier>Desert Mfg</supplier>\n  </product>\n  <product sku="ACME-02" inStock="false">\n    <title>Rocket Skates</title>\n    <category>Propulsion</category>\n    <price>299.50</price>\n    <supplier>Aero Dynamics</supplier>\n  </product>\n</inventory>',
        primaryActionLabel: 'Export to Excel',
        availableExportFormats: ['xlsx', 'csv', 'html', 'json'],
        defaultExportFormat: 'xlsx',
        outputMode: 'table',
        badgeText: 'Auto XML Hierarchy Flattening',
        iconName: 'FileSpreadsheet',
    },
    validate(input: string) {
        if (!input || input.trim() === '') {
            return { valid: false, errors: [{ message: 'Input is empty' }] };
        }
        return { valid: true };
    },
    parse(input: string, options?: any): ConversionResult {
        return parseXml(input, options);
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
                filename: `xml_export_${Date.now()}.xlsx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (format === 'csv') {
            const csv = jsonToCsv(data, schema);
            return {
                content: csv,
                filename: `xml_export_${Date.now()}.csv`,
                mimeType: 'text/csv;charset=utf-8;',
            };
        }
        return {
            content: JSON.stringify(data, null, 2),
            filename: `xml_export_${Date.now()}.json`,
            mimeType: 'application/json',
        };
    },
};
