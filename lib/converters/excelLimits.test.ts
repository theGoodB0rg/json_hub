import { MAX_CELL_CHARS, clampCellText, sanitizeRows, sanitizeSheetName } from './excelLimits';

describe('clampCellText', () => {
    it('leaves text at the limit untouched', () => {
        const text = 'a'.repeat(MAX_CELL_CHARS);
        expect(clampCellText(text)).toEqual({ text, dropped: 0 });
    });

    it('clamps one character over the limit, within the limit, with a marker', () => {
        const { text, dropped } = clampCellText('a'.repeat(MAX_CELL_CHARS + 1));
        expect(text.length).toBeLessThanOrEqual(MAX_CELL_CHARS);
        expect(text).toMatch(/… \[truncated [\d,]+ chars\]$/);
        expect(dropped).toBeGreaterThan(0);
    });

    it('reports exactly the characters it removed', () => {
        const input = 'x'.repeat(100_000);
        const { text, dropped } = clampCellText(input);
        const kept = text.slice(0, text.indexOf('…')).length;
        expect(kept + dropped).toBe(input.length);
    });

    it('does not split a surrogate pair at the cut', () => {
        for (let pad = 0; pad < 40; pad++) {
            const { text } = clampCellText('a'.repeat(pad) + '😀'.repeat(MAX_CELL_CHARS));
            expect(text).not.toMatch(/[\ud800-\udbff]…/);
            expect(text.length).toBeLessThanOrEqual(MAX_CELL_CHARS);
        }
    });
});

describe('sanitizeRows', () => {
    it('clamps oversized cells and headers, counting each', () => {
        const big = 'b'.repeat(MAX_CELL_CHARS + 500);
        const { rows, report } = sanitizeRows([[big, 'ok'], [1, big]]);
        expect(rows[0][0].length).toBeLessThanOrEqual(MAX_CELL_CHARS);
        expect(rows[1][1].length).toBeLessThanOrEqual(MAX_CELL_CHARS);
        expect(rows[0][1]).toBe('ok');
        expect(report.truncatedCells).toBe(2);
    });

    it('does not copy rows that need no change, and does not mutate input', () => {
        const clean = ['a', 1, null];
        const dirty = ['c'.repeat(MAX_CELL_CHARS + 1)];
        const { rows } = sanitizeRows([clean, dirty]);
        expect(rows[0]).toBe(clean);
        expect(dirty[0].length).toBe(MAX_CELL_CHARS + 1);
    });
});

describe('sanitizeSheetName', () => {
    it('caps length at 31 and strips forbidden characters', () => {
        expect(sanitizeSheetName('x'.repeat(40))).toHaveLength(31);
        expect(sanitizeSheetName('a/b:c*d?e[f]g')).toBe('a_b_c_d_e_f_g');
    });
    it('never returns an empty name', () => {
        expect(sanitizeSheetName('   ')).toBe('Sheet1');
    });
});
