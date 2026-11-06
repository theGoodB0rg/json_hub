import { validateAndParse, isValidJSON, getEncodingDepth, escapeControlCharsInStrings } from './smartParse';

describe('smartParse', () => {
    describe('validateAndParse', () => {
        it('should parse valid JSON object', () => {
            const input = '{"name": "John", "age": 30}';
            const result = validateAndParse(input);

            expect(result.success).toBe(true);
            // Note: We no longer wrap single objects in arrays
            expect(result.data).toEqual({ name: 'John', age: 30 });
            expect(result.errors).toBeUndefined();
        });

        it('should parse valid JSON array', () => {
            const input = '[1, 2, 3, 4, 5]';
            const result = validateAndParse(input);

            expect(result.success).toBe(true);
            expect(result.data).toEqual([1, 2, 3, 4, 5]);
        });

        it('should auto-unescape double-encoded JSON', () => {
            const original = { message: 'Hello World' };
            const doubleEncoded = JSON.stringify(JSON.stringify(original));
            const result = validateAndParse(doubleEncoded);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(original);
        });

        it('should auto-unescape triple-encoded JSON', () => {
            const original = { nested: { value: 42 } };
            const tripleEncoded = JSON.stringify(
                JSON.stringify(JSON.stringify(original))
            );
            const result = validateAndParse(tripleEncoded);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(original);
        });

        it('should handle empty input', () => {
            const result = validateAndParse('');

            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors?.[0].message).toBe('Input is empty');
        });

        it('should handle whitespace-only input', () => {
            const result = validateAndParse('   \n\t  ');

            expect(result.success).toBe(false);
            expect(result.errors?.[0].message).toBe('Input is empty');
        });

        it('should return detailed error for malformed JSON', () => {
            const input = '{"name": "John", "age": 30'; // Missing closing brace
            const result = validateAndParse(input);

            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors?.[0].message).toContain('JSON');
        });

        it('strips a UTF-8 byte-order mark (Windows-saved files)', () => {
            const result = validateAndParse('﻿[{"id": 1}]');
            expect(result.success).toBe(true);
            expect(result.data).toEqual([{ id: 1 }]);
        });

        it('reads JSON Lines as an array of rows', () => {
            const result = validateAndParse('{"id": 1}\n{"id": 2}\r\n\n{"id": 3}\n');
            expect(result.success).toBe(true);
            expect(result.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
        });

        it('does not misread broken JSON as JSON Lines', () => {
            const result = validateAndParse('{"id": 1}\n{"id": 2');
            expect(result.success).toBe(false);
        });

        it('does not treat a single broken line as JSON Lines', () => {
            expect(validateAndParse('{"id": 1').success).toBe(false);
        });

        it('tells the user when the input is XML', () => {
            const result = validateAndParse('<?xml version="1.0"?><root><a>1</a></root>');
            expect(result.success).toBe(false);
            expect(result.errors?.[0].message).toMatch(/looks like XML/);
        });

        it('tells the user when the input is an HTML page', () => {
            const result = validateAndParse('<!DOCTYPE html><html><body>Login</body></html>');
            expect(result.errors?.[0].message).toMatch(/HTML page/);
        });

        it('tells the user when the input is CSV', () => {
            const result = validateAndParse('id,name\n1,Alice\n2,Bob');
            expect(result.errors?.[0].message).toMatch(/CSV/);
        });

        it('gives no format hint for ordinary malformed JSON', () => {
            const result = validateAndParse('{"a": 1,}');
            expect(result.errors?.[0].message).not.toMatch(/looks like/);
        });

        it('should handle deeply nested objects', () => {
            const deepObject = { a: { b: { c: { d: { e: { f: 'deep' } } } } } };
            const input = JSON.stringify(deepObject);
            const result = validateAndParse(input);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(deepObject);
        });

        it('should handle large objects', () => {
            const largeObject: Record<string, number> = {};
            for (let i = 0; i < 10000; i++) {
                largeObject[`key${i}`] = i;
            }
            const input = JSON.stringify(largeObject);
            const result = validateAndParse(input);

            expect(result.success).toBe(true);
            expect(Object.keys(result.data).length).toBe(10000);
        });

        it('should prevent infinite recursion with max depth limit', () => {
            // Create 15 levels of encoding (more than MAX_RECURSION_DEPTH of 10)
            let encoded = '{"value": 1}';
            for (let i = 0; i < 15; i++) {
                encoded = JSON.stringify(encoded);
            }

            const result = validateAndParse(encoded);

            expect(result.success).toBe(false);
            expect(result.errors?.[0].message).toContain('Maximum recursion depth');
        });

        it('should handle mixed data types', () => {
            const input = JSON.stringify({
                string: 'text',
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3],
                object: { nested: 'value' },
            });
            const result = validateAndParse(input);

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('string', 'text');
            expect(result.data).toHaveProperty('number', 42);
            expect(result.data).toHaveProperty('boolean', true);
            expect(result.data).toHaveProperty('null', null);
        });

        it('should handle special characters in strings', () => {
            const input = JSON.stringify({
                quote: 'He said "Hello"',
                newline: 'Line 1\nLine 2',
                tab: 'Col1\tCol2',
                unicode: '你好世界',
            });
            const result = validateAndParse(input);

            expect(result.success).toBe(true);
            expect(result.data.quote).toBe('He said "Hello"');
            expect(result.data.newline).toBe('Line 1\nLine 2');
        });

        it('should return single object as-is (no longer wraps in array)', () => {
            const input = '{"name": "Single Object"}';
            const result = validateAndParse(input);

            expect(result.success).toBe(true);
            // Note: smartUnwrap now handles wrapper detection consistently
            expect(result.data).toEqual({ name: 'Single Object' });
        });
    });

    describe('isValidJSON', () => {
        it('should return true for valid JSON', () => {
            expect(isValidJSON('{"valid": true}')).toBe(true);
            expect(isValidJSON('[1, 2, 3]')).toBe(true);
            expect(isValidJSON('"string"')).toBe(true);
            expect(isValidJSON('123')).toBe(true);
            expect(isValidJSON('true')).toBe(true);
            expect(isValidJSON('null')).toBe(true);
        });

        it('should return false for invalid JSON', () => {
            expect(isValidJSON('{')).toBe(false);
            expect(isValidJSON('undefined')).toBe(false);
            expect(isValidJSON('')).toBe(false);
            expect(isValidJSON('not json')).toBe(false);
        });
    });

    describe('getEncodingDepth', () => {
        it('should return 0 for non-encoded JSON', () => {
            const input = '{"name": "John"}';
            expect(getEncodingDepth(input)).toBe(0);
        });

        it('should return 1 for double-encoded JSON', () => {
            const input = JSON.stringify('{"name": "John"}');
            expect(getEncodingDepth(input)).toBe(1);
        });

        it('should return 2 for triple-encoded JSON', () => {
            const input = JSON.stringify(JSON.stringify('{"name": "John"}'));
            expect(getEncodingDepth(input)).toBe(2);
        });

        it('should handle max depth limit', () => {
            let encoded = '{"value": 1}';
            for (let i = 0; i < 15; i++) {
                encoded = JSON.stringify(encoded);
            }
            const depth = getEncodingDepth(encoded);
            expect(depth).toBeLessThanOrEqual(10);
        });

        it('should return 0 for invalid JSON', () => {
            expect(getEncodingDepth('invalid')).toBe(0);
        });
    });
});

describe('back-to-back JSON documents', () => {
    const doc = (id: number) => JSON.stringify({ id, tags: ['a', 'b'], text: 'has } and ] inside' }, null, 2);

    it('reads pretty-printed documents written one after another', () => {
        const result = validateAndParse(`${doc(1)}\n${doc(2)}\n${doc(3)}`);
        expect(result.success).toBe(true);
        expect((result.data as any[]).map((r) => r.id)).toEqual([1, 2, 3]);
    });

    it('joins pages of results saved into one file', () => {
        const result = validateAndParse('[{"p":1},{"p":1}]\n\n[{"p":2}]');
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
    });

    it('accepts objects separated by commas without outer brackets', () => {
        const result = validateAndParse('{"a":1},\n{"a":2}');
        expect(result.success).toBe(true);
        expect(result.data).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it.each([
        ['trailing junk after one document', '{"a":1} oops'],
        ['an unclosed second document', '{"a":1}\n{"a":'],
        ['a single invalid document', '{"a":1,}'],
        ['an extra closing brace', '{"a":1}}'],
    ])('still rejects %s', (_label, input) => {
        expect(validateAndParse(input).success).toBe(false);
    });
});

describe('raw control characters inside strings', () => {
    it('repairs tabs and line breaks pasted into string values', () => {
        const result = validateAndParse('[{"note":"line one\nline two\tTabbed"}]');
        expect(result.success).toBe(true);
        expect((result.data as any[])[0].note).toBe('line one\nline two\tTabbed');
    });

    it('escapes other control characters as unicode escapes', () => {
        expect(escapeControlCharsInStrings('{"x":"a' + String.fromCharCode(1) + 'b"}')).toBe('{"x":"a\\u0001b"}');
    });

    it('leaves whitespace between tokens alone and reports no change', () => {
        expect(escapeControlCharsInStrings('{\n\t"x": "ok"\n}')).toBeNull();
    });

    it('still reports other syntax errors', () => {
        expect(validateAndParse('{"x":"a\nb",}').success).toBe(false);
    });
});
