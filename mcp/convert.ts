import { parseAndFlatten } from '@/lib/parsers/pipeline';
import { jsonToCsv } from '@/lib/converters/csvCore';
import { buildShareUrl } from '@/lib/utils/shareLink';

/** Every tunable number for the chat app, in one place. */
export const LIMITS = {
    /** Largest JSON text the tool accepts (chat tool arguments are small in practice). */
    maxInputChars: 500_000,
    /** CSV longer than this is cut (at a row boundary) in the chat reply. */
    maxInlineCsvChars: 60_000,
    /** Rows shown in the in-chat table. */
    previewRows: 20,
    /** Longest cell text shown in the in-chat table. */
    previewCellChars: 80,
    /** Longest compressed payload put in an "Open in JsonExport" link. */
    maxShareCompressed: 16_000,
} as const;

export const SITE_ORIGIN = 'https://jsonexport.com';

/** Attribution tag on links handed out by the chat app (see campaignReferrer). */
export const SHARE_REF = 'mcp';

export interface ChatConversion {
    rowCount: number;
    columns: string[];
    previewRows: Record<string, string>[];
    /** CSV with a UTF-8 BOM so Excel reads accents correctly. */
    csv: string;
    /** True when `csv` holds only the first rows. */
    csvTruncated: boolean;
    /** Opens jsonexport.com with this data loaded; null when too big for a link. */
    openUrl: string | null;
}

export type ConvertOutcome = { ok: true; value: ChatConversion } | { ok: false; error: string };

function previewCell(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    return text.length > LIMITS.previewCellChars ? `${text.slice(0, LIMITS.previewCellChars - 1)}…` : text;
}

/** Cuts CSV to at most `max` characters without splitting a row. */
function truncateCsv(csv: string, max: number): { csv: string; truncated: boolean } {
    if (csv.length <= max) return { csv, truncated: false };
    const cut = csv.lastIndexOf('\n', max);
    return { csv: csv.slice(0, cut > 0 ? cut : max), truncated: true };
}

/**
 * JSON text in, everything the chat needs out: row count, columns, a preview,
 * CSV and a link to finish in the browser. Uses the exact parser the website
 * uses, so the chat and jsonexport.com always agree. Stores nothing.
 */
export function convertForChat(json: string): ConvertOutcome {
    if (json.length > LIMITS.maxInputChars) {
        return {
            ok: false,
            error: `Input is ${json.length.toLocaleString('en-US')} characters; the chat app takes up to ${LIMITS.maxInputChars.toLocaleString('en-US')}. Open ${SITE_ORIGIN} and drop the file there instead (it runs in your browser).`,
        };
    }

    let result;
    try {
        result = parseAndFlatten(json);
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Could not convert this JSON' };
    }
    if (!result.ok) return { ok: false, error: result.error };
    if (result.rows.length === 0) return { ok: false, error: 'The JSON has no records to turn into rows' };

    const { rows, schema } = result;
    const { csv, truncated } = truncateCsv(jsonToCsv(rows, schema), LIMITS.maxInlineCsvChars);

    return {
        ok: true,
        value: {
            rowCount: rows.length,
            columns: schema,
            previewRows: rows.slice(0, LIMITS.previewRows).map((row) =>
                Object.fromEntries(schema.map((col) => [col, previewCell(row[col])]))
            ),
            csv,
            csvTruncated: truncated,
            openUrl: buildShareUrl(SITE_ORIGIN, json, { maxCompressed: LIMITS.maxShareCompressed, ref: SHARE_REF }),
        },
    };
}

/** The plain-text reply every client sees, including ones without a UI. */
export function chatSummary(c: ChatConversion): string {
    const lines = [
        `Converted ${c.rowCount.toLocaleString('en-US')} row(s) × ${c.columns.length} column(s).`,
        `Columns: ${c.columns.slice(0, 30).join(', ')}${c.columns.length > 30 ? ', …' : ''}`,
        '',
        c.csvTruncated ? 'CSV (first rows only, the full data is too long for chat):' : 'CSV:',
        '```csv',
        c.csv.replace(/^﻿/, ''),
        '```',
        '',
    ];
    lines.push(
        c.openUrl
            ? `Excel (.xlsx), full CSV and other formats: open ${c.openUrl} (the data loads in the browser and is never uploaded).`
            : `For Excel (.xlsx) or the full file, open ${SITE_ORIGIN} and paste or drop the JSON there (it runs in the browser).`
    );
    return lines.join('\n');
}
