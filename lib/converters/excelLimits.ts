/**
 * Excel's hard format limits, and the pure functions that enforce them.
 *
 * SheetJS does not validate while a sheet is built. It throws only inside
 * `XLSX.write`, so an over-long cell used to fail the whole export at the
 * last step ("Text length must not exceed 32767 characters") after the user
 * had done all the work. Every sheet now passes through `sanitizeRows`.
 */

export const MAX_CELL_CHARS = 32767;
export const MAX_SHEET_NAME_CHARS = 31;

export interface XlsxLimitReport {
    /** Cells whose text was shortened to fit MAX_CELL_CHARS. */
    truncatedCells: number;
    /** Characters dropped across all truncated cells. */
    droppedChars: number;
}

export const emptyReport = (): XlsxLimitReport => ({ truncatedCells: 0, droppedChars: 0 });

export const hasLimitHits = (r: XlsxLimitReport): boolean => r.truncatedCells > 0;

export function mergeReports(a: XlsxLimitReport, b: XlsxLimitReport): XlsxLimitReport {
    return {
        truncatedCells: a.truncatedCells + b.truncatedCells,
        droppedChars: a.droppedChars + b.droppedChars,
    };
}

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;

/**
 * Shortens `text` to at most MAX_CELL_CHARS, ending with a visible marker so
 * the reader can see that content is missing and how much. The cut never
 * splits a surrogate pair (an emoji cut in half is invalid text).
 */
export function clampCellText(text: string): { text: string; dropped: number } {
    if (text.length <= MAX_CELL_CHARS) return { text, dropped: 0 };

    // The marker states the dropped count, which depends on where we cut, so
    // size it for the worst case: every character dropped.
    const marker = (n: number) => `… [truncated ${n.toLocaleString('en-US')} chars]`;
    const budget = MAX_CELL_CHARS - marker(text.length).length;
    let cut = budget;
    if (isHighSurrogate(text.charCodeAt(cut - 1))) cut -= 1;

    const dropped = text.length - cut;
    return { text: text.slice(0, cut) + marker(dropped), dropped };
}

/** Excel rejects `: \ / ? * [ ]`, leading/trailing apostrophes, blank names and >31 chars. */
export function sanitizeSheetName(name: string): string {
    const cleaned = name
        .replace(/[:\\/?*[\]]/g, '_')
        .replace(/^'+|'+$/g, '')
        .trim();
    const bounded = Array.from(cleaned).slice(0, MAX_SHEET_NAME_CHARS).join('').slice(0, MAX_SHEET_NAME_CHARS);
    return bounded || 'Sheet1';
}

/**
 * Returns rows with every oversized string cell (header row included, it is
 * just row 0) clamped. Rows with nothing to change are returned as-is, so the
 * common case allocates nothing extra.
 */
export function sanitizeRows<T>(rows: T[][]): { rows: T[][]; report: XlsxLimitReport } {
    const report = emptyReport();
    const out = rows.map((row) => {
        let copy: T[] | null = null;
        for (let c = 0; c < row.length; c++) {
            const value = row[c];
            if (typeof value !== 'string' || value.length <= MAX_CELL_CHARS) continue;
            const { text, dropped } = clampCellText(value);
            copy ??= row.slice();
            copy[c] = text as unknown as T;
            report.truncatedCells += 1;
            report.droppedChars += dropped;
        }
        return copy ?? row;
    });
    return { rows: out, report };
}

export function describeReport(report: XlsxLimitReport): string {
    const n = report.truncatedCells;
    return `${n.toLocaleString('en-US')} ${n === 1 ? 'cell was' : 'cells were'} shortened to fit Excel's ${MAX_CELL_CHARS.toLocaleString('en-US')}-character limit. Export to CSV or JSON to keep the full text.`;
}
