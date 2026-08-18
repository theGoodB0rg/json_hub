export type DataFormat = 'json' | 'csv' | 'xml' | 'xlsx' | 'html' | 'docx' | 'zip';

export type OutputViewMode = 'table' | 'code' | 'tree';

export interface FormatDefinition {
    id: DataFormat;
    name: string;
    extension: string;
    acceptedExtensions: string[];
    mimeType: string;
    monacoLanguage: 'json' | 'xml' | 'plaintext';
}

export interface ParseOptions {
    delimiter?: string;
    inferTypes?: boolean;
    xmlAttributePrefix?: string;
    xmlArrayNodes?: string[];
    maxRows?: number;
    [key: string]: any;
}

export interface ParseError {
    message: string;
    line?: number;
    column?: number;
}

export interface ConversionResult {
    success: boolean;
    data?: any; // Raw parsed data / object structure
    flatData?: Record<string, any>[]; // Flattened table rows
    schema?: string[]; // Detected headers
    formattedOutput?: string; // e.g., beautified JSON string if target is JSON
    errors?: ParseError[];
    warnings?: string[];
}

export interface ExportResult {
    blob?: Blob;
    content?: string;
    filename: string;
    mimeType: string;
}

export interface UIPluginConfig {
    inputTitle: string;
    inputPlaceholder: string;
    dropzoneText: string;
    dropzoneAcceptedExtensions: string[];
    defaultSample: string;
    primaryActionLabel: string;
    availableExportFormats: DataFormat[];
    defaultExportFormat: DataFormat;
    outputMode: OutputViewMode; // 'table' for spreadsheet preview, 'code' for JSON editor preview
    badgeText?: string;
    iconName?: string;
}

export interface ConverterPlugin {
    id: string; // e.g. 'csv-to-json', 'xml-to-excel'
    name: string; // e.g. 'CSV to JSON Converter'
    sourceFormat: DataFormat;
    targetFormat: DataFormat;
    uiConfig: UIPluginConfig;
    
    // Core engine methods
    validate(input: string): { valid: boolean; errors?: ParseError[] };
    parse(input: string, options?: ParseOptions): Promise<ConversionResult> | ConversionResult;
    export(data: any, format: DataFormat, options?: any): Promise<ExportResult> | ExportResult;
}
