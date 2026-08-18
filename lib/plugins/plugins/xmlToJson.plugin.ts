import type { ConverterPlugin, ConversionResult, ExportResult, DataFormat } from '@/types/converter.types';
import { parseXml } from '@/lib/parsers/xml/xmlParser';

export const xmlToJsonPlugin: ConverterPlugin = {
    id: 'xml-to-json',
    name: 'XML to JSON Converter',
    sourceFormat: 'xml',
    targetFormat: 'json',
    uiConfig: {
        inputTitle: 'Paste or Drop XML Document',
        inputPlaceholder: '<root>\n  <user id="1">\n    <name>Alice</name>\n  </user>\n</root>',
        dropzoneText: 'Drag & drop XML files here (.xml, .rss, .atom, .txt)',
        dropzoneAcceptedExtensions: ['.xml', '.rss', '.atom', '.svg', '.txt'],
        defaultSample: '<?xml version="1.0" encoding="UTF-8"?>\n<company name="TechCorp" founded="2020">\n  <departments>\n    <department id="d1" name="Engineering">\n      <lead>Grace Hopper</lead>\n      <headcount>45</headcount>\n    </department>\n    <department id="d2" name="Product">\n      <lead>Ada Lovelace</lead>\n      <headcount>18</headcount>\n    </department>\n  </departments>\n</company>',
        primaryActionLabel: 'Convert to JSON',
        availableExportFormats: ['json', 'csv'],
        defaultExportFormat: 'json',
        outputMode: 'code',
        badgeText: 'Preserves Attributes & Arrays',
        iconName: 'FileJson',
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
    export(data: any, format: DataFormat): ExportResult {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        return {
            content,
            filename: `converted_xml_${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`,
            mimeType: format === 'csv' ? 'text/csv' : 'application/json',
        };
    },
};
