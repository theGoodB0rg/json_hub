import { createControlCharEscaper, escapeControlCharsInStrings } from './controlChars';

describe('control character escaping', () => {
    it('escapes inside strings and leaves structural whitespace alone', () => {
        const input = '{\n\t"a": "x' + '\t' + 'y"\n}';
        expect(escapeControlCharsInStrings(input)).toBe('{\n\t"a": "x\\ty"\n}');
    });

    it('keeps state across chunk boundaries, including a split escape', () => {
        const escaper = createControlCharEscaper();
        const out = ['{"a":"one\\', '"two', '\n', 'three"}'].map((c) => escaper.push(c)).join('');
        expect(JSON.parse(out)).toEqual({ a: 'one"two\nthree' });
    });

    it('returns the same string untouched when nothing needs escaping', () => {
        const escaper = createControlCharEscaper();
        const chunk = '[{"a":"b"}]';
        expect(escaper.push(chunk)).toBe(chunk);
        expect(escaper.changed).toBe(false);
    });
});
