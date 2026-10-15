import { classifyErrorMessage, redactErrorMessage } from './error-classify';

describe('classifyErrorMessage', () => {
    it.each([
        ['Input is empty', 'empty_input'],
        ['This looks like XML, not JSON. Use the XML to Excel converter instead. (Unexpected token)', 'not_json_xml'],
        ['This looks like an HTML page, not JSON.', 'not_json_html'],
        ['This looks like CSV or a spreadsheet export, not JSON.', 'not_json_csv'],
        ['Unexpected end of JSON input', 'json_truncated'],
        ['JSON.parse: unexpected end of data at line 1 column 10 of the JSON data', 'json_truncated'],
        ['Unterminated string in JSON at position 42', 'json_truncated'],
        ["Unexpected token 'a', \"abc\" is not valid JSON", 'json_syntax'],
        ['JSON Parse error: Unexpected identifier "secret"', 'json_syntax'],
        ["Expected ',' or '}' after property value in JSON at position 17", 'json_syntax'],
        ['Maximum recursion depth (10) exceeded.', 'encoding_depth'],
        ['No data items found in JSON', 'no_items'],
        ['File read error: NotReadableError: The file could not be read', 'file_read'],
        ['Invalid string length', 'out_of_memory'],
        ['Maximum call stack size exceeded', 'stack_overflow'],
        ['something odd happened', 'unknown'],
        ['', 'unknown'],
    ])('%s → %s', (message, expected) => {
        expect(classifyErrorMessage(message)).toBe(expected);
    });
});

describe('redactErrorMessage', () => {
    it('removes quoted user content but keeps positions (V8)', () => {
        expect(redactErrorMessage(`Unexpected token 'a', "acct_9f2 ssn=123-45-6789" is not valid JSON`))
            .toBe(`Unexpected token '…', "…" is not valid JSON`);
    });

    it('removes quoted content in Safari messages', () => {
        expect(redactErrorMessage('JSON Parse error: Unexpected identifier "password123"'))
            .toBe('JSON Parse error: Unexpected identifier "…"');
    });

    it('REGRESSION: removes V8 snippets whose inner quotes are not escaped', () => {
        expect(redactErrorMessage(`Unexpected token 'j', "{"email":jane@example.com}" is not valid JSON`))
            .toBe(`Unexpected token '…', "…" is not valid JSON`);
    });

    it('removes an unclosed snippet the engine truncated', () => {
        const out = redactErrorMessage('Unexpected token, "{"email":"jane@exa... is not valid');
        expect(out).not.toMatch(/jane|email/);
    });

    it('keeps single punctuation tokens, which carry the meaning', () => {
        expect(redactErrorMessage(`Expected ',' or '}' after property value in JSON at position 17`))
            .toBe(`Expected ',' or '}' after property value in JSON at position 17`);
    });

    it('keeps line and column numbers', () => {
        const msg = 'JSON.parse: expected double-quoted property name at line 3 column 5 of the JSON data';
        expect(redactErrorMessage(msg)).toBe(msg);
    });

    it('drops long unbroken tokens such as tokens or base64', () => {
        expect(redactErrorMessage(`bad value eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0 here`))
            .toBe('bad value … here');
    });

    it('caps length', () => {
        expect(redactErrorMessage('x '.repeat(500)).length).toBeLessThanOrEqual(200);
    });

    it('handles empty input', () => {
        expect(redactErrorMessage(undefined)).toBe('');
    });
});
