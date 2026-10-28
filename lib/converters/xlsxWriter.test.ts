import * as XLSX from 'xlsx';
import { jsonToXlsx } from './jsonToXlsx';
import { jsonToXlsxHierarchical } from './jsonToXlsx';
import { generateTableXlsx } from './jsonToXlsxTableView';
import { writeXlsx } from './xlsxWriter';
import { MAX_CELL_CHARS } from './excelLimits';
import { classifyErrorMessage } from '@/lib/telemetry/error-classify';

const BIG = 'z'.repeat(40_000);

function readBack(bytes: ArrayBuffer): string[][] {
    const wb = XLSX.read(bytes, { type: 'array' });
    return XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as string[][];
}

describe('xlsx export with cells over Excel\'s limit', () => {
    it('flat export writes a readable file instead of throwing', () => {
        const wb = jsonToXlsx([{ id: 1, blob: BIG }], ['id', 'blob']);
        const rows = readBack(writeXlsx(wb));
        expect(rows[1][0]).toBe(1);
        expect(rows[1][1].length).toBeLessThanOrEqual(MAX_CELL_CHARS);
        expect(rows[1][1]).toContain('truncated');
    });

    it('an oversized header is clamped too', () => {
        const wb = jsonToXlsx([{ [BIG]: 'v' }], [BIG]);
        expect(readBack(writeXlsx(wb))[0][0].length).toBeLessThanOrEqual(MAX_CELL_CHARS);
    });

    it('hierarchical export survives', () => {
        const wb = jsonToXlsxHierarchical({ a: { b: BIG } });
        expect(() => writeXlsx(wb)).not.toThrow();
    });

    it('table-view export survives', () => {
        const wb = generateTableXlsx([{ id: 1, notes: BIG }]);
        expect(wb).not.toBeNull();
        expect(() => writeXlsx(wb!)).not.toThrow();
    });

    it('a cell exactly at the limit is written unchanged', () => {
        const exact = 'q'.repeat(MAX_CELL_CHARS);
        const rows = readBack(writeXlsx(jsonToXlsx([{ v: exact }], ['v'])));
        expect(rows[1][0]).toBe(exact);
    });
});

describe('telemetry classification', () => {
    it('files the SheetJS limit errors as excel_limit', () => {
        expect(classifyErrorMessage('Text length must not exceed 32767 characters')).toBe('excel_limit');
        expect(classifyErrorMessage('Sheet names cannot exceed 31 chars')).toBe('excel_limit');
    });
});
