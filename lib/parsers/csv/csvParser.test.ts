import { detectDelimiter, tokenizeCsv, inferValue, parseCsvToJson } from './csvParser';

describe('CSV Parser', () => {
    describe('detectDelimiter', () => {
        it('detects standard comma delimiter', () => {
            const csv = 'name,age,city\nAlice,30,London\nBob,25,Paris';
            expect(detectDelimiter(csv)).toBe(',');
        });

        it('detects semicolon delimiter', () => {
            const csv = 'name;age;city\nAlice;30;London\nBob;25;Paris';
            expect(detectDelimiter(csv)).toBe(';');
        });

        it('detects tab delimiter (TSV)', () => {
            const tsv = 'name\tage\tcity\nAlice\t30\tLondon\nBob\t25\tParis';
            expect(detectDelimiter(tsv)).toBe('\t');
        });

        it('detects pipe delimiter', () => {
            const psv = 'name|age|city\nAlice|30|London\nBob|25|Paris';
            expect(detectDelimiter(psv)).toBe('|');
        });
    });

    describe('tokenizeCsv', () => {
        it('handles quotes containing commas and escaped quotes', () => {
            const csv = 'id,summary,description\n1,"Bug, urgent!","Said ""Hello"" to team"';
            const { rows, errors } = tokenizeCsv(csv, ',');
            expect(errors).toHaveLength(0);
            expect(rows).toEqual([
                ['id', 'summary', 'description'],
                ['1', 'Bug, urgent!', 'Said "Hello" to team'],
            ]);
        });

        it('handles multiline quoted values', () => {
            const csv = 'id,notes\n101,"Line 1\nLine 2\nLine 3"';
            const { rows, errors } = tokenizeCsv(csv, ',');
            expect(errors).toHaveLength(0);
            expect(rows[1][1]).toBe('Line 1\nLine 2\nLine 3');
        });

        it('reports error on unclosed quote', () => {
            const csv = 'id,name\n1,"Unclosed Alice';
            const { errors } = tokenizeCsv(csv, ',');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].message).toContain('Unclosed quote');
        });
    });

    describe('inferValue', () => {
        it('casts numbers, booleans, and nulls correctly', () => {
            expect(inferValue('42')).toBe(42);
            expect(inferValue('3.1415')).toBe(3.1415);
            expect(inferValue('true')).toBe(true);
            expect(inferValue('FALSE')).toBe(false);
            expect(inferValue('null')).toBe(null);
        });

        it('preserves leading zeros for identifiers/zips', () => {
            expect(inferValue('01234')).toBe('01234');
        });

        it('parses embedded JSON objects/arrays', () => {
            expect(inferValue('{"tag":"vip"}')).toEqual({ tag: 'vip' });
            expect(inferValue('[1,2,3]')).toEqual([1, 2, 3]);
        });
    });

    describe('parseCsvToJson', () => {
        it('parses standard CSV to clean JSON records and schema', () => {
            const csv = 'Name,Age,Active\nAlice,28,true\nBob,34,false';
            const result = parseCsvToJson(csv);

            expect(result.success).toBe(true);
            expect(result.schema).toEqual(['Name', 'Age', 'Active']);
            expect(result.flatData).toEqual([
                { Name: 'Alice', Age: 28, Active: true },
                { Name: 'Bob', Age: 34, Active: false },
            ]);
            expect(result.formattedOutput).toContain('"Name": "Alice"');
        });

        it('deduplicates identical headers cleanly', () => {
            const csv = 'item,item,item\napple,banana,orange';
            const result = parseCsvToJson(csv);

            expect(result.success).toBe(true);
            expect(result.schema).toEqual(['item', 'item_1', 'item_2']);
            expect(result.flatData).toEqual([
                { item: 'apple', item_1: 'banana', item_2: 'orange' },
            ]);
        });

        it('handles empty input gracefully', () => {
            const result = parseCsvToJson('');
            expect(result.success).toBe(false);
            expect(result.errors?.[0]?.message).toBe('Input is empty');
        });
    });
});
