import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

/**
 * Excel's limits are enforced in xlsxWriter.ts. This fails when any other
 * module serialises a workbook or builds a sheet from rows directly, which
 * would reintroduce "Text length must not exceed 32767 characters".
 */
const ROOT = join(__dirname, '..');
const ALLOWED = new Set([join('converters', 'xlsxWriter.ts')]);
const FORBIDDEN = /XLSX\.write\(|XLSX\.writeFile\(|aoa_to_sheet\(|json_to_sheet\(|book_append_sheet\(/;

function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) return name === 'node_modules' ? [] : sources(full);
        return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
    });
}

it('no module outside xlsxWriter.ts writes workbooks or builds sheets directly', () => {
    const offenders = sources(ROOT)
        .map((f) => relative(ROOT, f))
        .filter((rel) => !ALLOWED.has(rel.split(sep).join(sep)))
        .filter((rel) => FORBIDDEN.test(readFileSync(join(ROOT, rel), 'utf8')));
    expect(offenders).toEqual([]);
});
