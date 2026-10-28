import * as XLSX from 'xlsx';
import {
    describeReport,
    emptyReport,
    hasLimitHits,
    mergeReports,
    sanitizeRows,
    sanitizeSheetName,
    type XlsxLimitReport,
} from './excelLimits';

/**
 * The only place in the app that builds a sheet from rows or serialises a
 * workbook. Routing every exporter through here is what keeps Excel's limits
 * enforced in one spot; `xlsxWriter.guard.test.ts` fails if anything bypasses it.
 */

const reports = new WeakMap<XLSX.WorkBook, XlsxLimitReport>();

/** `aoa_to_sheet` with Excel's cell limit applied. */
export function buildSheet(rows: any[][]): { worksheet: XLSX.WorkSheet; report: XlsxLimitReport } {
    const { rows: safe, report } = sanitizeRows(rows);
    return { worksheet: XLSX.utils.aoa_to_sheet(safe), report };
}

/** Appends a sheet under a valid name and remembers what was shortened. */
export function appendSheet(
    workbook: XLSX.WorkBook,
    worksheet: XLSX.WorkSheet,
    name: string,
    report: XlsxLimitReport
): void {
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(name));
    reports.set(workbook, mergeReports(reports.get(workbook) ?? emptyReport(), report));
}

export function limitReportFor(workbook: XLSX.WorkBook): XlsxLimitReport {
    return reports.get(workbook) ?? emptyReport();
}

/**
 * Serialises a workbook. When content had to be shortened, tells the user
 * (main thread only; workers have no UI), so a trimmed file is never silent.
 */
export function writeXlsx(workbook: XLSX.WorkBook): ArrayBuffer {
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const report = limitReportFor(workbook);
    if (hasLimitHits(report) && typeof window !== 'undefined') {
        void import('@/lib/platform/exportErrorToast')
            .then((toasts) => toasts.showExcelLimitToast(describeReport(report)))
            .catch(() => {
                // The toast is a courtesy; the file itself is already valid.
            });
    }
    return bytes;
}
