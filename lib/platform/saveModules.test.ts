/**
 * The save path must never be a lazy chunk.
 *
 * Code that runs once a file is handed to the browser cannot fetch anything:
 * WebKit (iOS and macOS Safari) cancels requests that start while a download
 * begins. When saveResultToast was a lazy import, Safari users got their file
 * and then an export error plus a recovery reload (chunk 7416 in telemetry,
 * Oct-Nov 2026). These modules are tiny and every export needs them, so they
 * are imported statically everywhere.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SCANNED_DIRS = ['app', 'components', 'lib', 'hooks'];
const SAVE_MODULES = [
    '@/lib/platform/downloadHelper',
    '@/lib/platform/saveResultToast',
    '@/lib/storage/conversionHistory',
];

function sourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(full);
        return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
    });
}

describe('save path modules', () => {
    it('are never imported lazily', () => {
        const offenders = SCANNED_DIRS
            .flatMap((dir) => sourceFiles(path.join(ROOT, dir)))
            .flatMap((file) => {
                const source = fs.readFileSync(file, 'utf8');
                return SAVE_MODULES
                    .filter((mod) => source.includes(`import('${mod}')`))
                    .map((mod) => `${path.relative(ROOT, file)} -> ${mod}`);
            });
        expect(offenders).toEqual([]);
    });
});
