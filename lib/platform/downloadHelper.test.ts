import { sanitizeFilename } from './downloadHelper';

/**
 * Covers every input shape that triggered a Save As "File not found. Check
 * the file name and try again." error in v0.1.2, plus the usual edge cases.
 * If a user ever reports that exact error again, the first debug step is to
 * add their offending filename here as a new test case and watch it go red.
 */
describe('sanitizeFilename', () => {
    describe('Windows-illegal characters', () => {
        test('strips ?, *, <, >, :, ", |, /, \\ from the stem', () => {
            expect(sanitizeFilename('api?v=2.json')).toBe('api_v=2.json');
            expect(sanitizeFilename('report:final.csv')).toBe('report_final.csv');
            expect(sanitizeFilename('a*b|c<d>e.xlsx')).toBe('a_b_c_d_e.xlsx');
            expect(sanitizeFilename('path/with/slashes.csv')).toBe('path_with_slashes.csv');
            expect(sanitizeFilename('win\\path\\file.csv')).toBe('win_path_file.csv');
            expect(sanitizeFilename('say "hi".txt')).toBe('say _hi_.txt');
        });

        test('strips ASCII control characters', () => {
            expect(sanitizeFilename('file\x00name.csv')).toBe('file_name.csv');
            expect(sanitizeFilename('tab\there.csv')).toBe('tab_here.csv');
            expect(sanitizeFilename('nl\nhere.csv')).toBe('nl_here.csv');
        });
    });

    describe('trailing dots and spaces (Windows strips silently)', () => {
        test('removes trailing dots from the stem', () => {
            expect(sanitizeFilename('export...csv')).toBe('export.csv');
            expect(sanitizeFilename('name....xlsx')).toBe('name.xlsx');
        });

        test('removes trailing spaces from the stem', () => {
            expect(sanitizeFilename('export   .csv')).toBe('export.csv');
        });
    });

    describe('fallback on empty / invalid-only input', () => {
        test('empty string returns "export"', () => {
            expect(sanitizeFilename('')).toBe('export');
        });

        test('only illegal chars returns "export" with extension kept', () => {
            expect(sanitizeFilename('???.csv')).toBe('___.csv');
        });

        test('all-dots returns "export"', () => {
            expect(sanitizeFilename('....')).toBe('export');
        });
    });

    describe('length cap (Windows MAX_PATH guardrail)', () => {
        test('clips to 240 chars so parent path fits under 260', () => {
            const long = 'a'.repeat(500) + '.csv';
            expect(sanitizeFilename(long).length).toBe(240);
        });

        test('short names pass through untouched', () => {
            expect(sanitizeFilename('report.csv')).toBe('report.csv');
        });
    });

    describe('extension preservation', () => {
        test('keeps the extension when stem is cleaned', () => {
            expect(sanitizeFilename('bad?name.xlsx')).toBe('bad_name.xlsx');
        });

        test('files without extension still sanitise', () => {
            expect(sanitizeFilename('bad?name')).toBe('bad_name');
        });

        test('hidden-file style (leading dot, no stem) treats whole thing as stem', () => {
            // '.' at index 0 means lastDot <= 0, so .gitignore stays as stem
            expect(sanitizeFilename('.gitignore')).toBe('.gitignore');
        });
    });

    describe('real-world shapes we saw in telemetry', () => {
        test('Jira export filename with "Sprint 42" style', () => {
            expect(sanitizeFilename('ENG Sprint 42: velocity.xlsx'))
                .toBe('ENG Sprint 42_ velocity.xlsx');
        });

        test('API path copied as filename', () => {
            expect(sanitizeFilename('/api/v2/users?limit=100.json'))
                .toBe('_api_v2_users_limit=100.json');
        });

        test('URL-encoded garbage still produces something saveable', () => {
            const result = sanitizeFilename('file%20name%3F.csv');
            expect(result).toMatch(/\.csv$/);
            expect(result.length).toBeGreaterThan(4);
        });
    });
});
