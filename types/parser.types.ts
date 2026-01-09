export interface ParseError {
    message: string;
    line?: number;
    column?: number;
}

export interface ParseResult {
    success: boolean;
    data?: any;
    errors?: ParseError[];
}

export interface FlattenResult {
    rows: Record<string, any>[];
    schema: string[];
}

export type ExportFormat = 'csv' | 'xlsx' | 'docx' | 'html' | 'zip';
