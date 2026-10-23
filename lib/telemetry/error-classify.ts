/**
 * Error classification and redaction for telemetry.
 *
 * Parser messages can quote the user's input (V8: `Unexpected token 'a',
 * "abc..." is not valid JSON`; Safari: `Unexpected identifier "abc"`).
 * AGENTS.md forbids sending payload data, so every error message is redacted
 * before it leaves the browser, and a stable `error_type` category is attached
 * so errors can be counted without reading free text.
 */

export type TelemetryErrorType =
    | 'empty_input'
    | 'not_json_xml'
    | 'not_json_html'
    | 'not_json_csv'
    | 'json_truncated'
    | 'json_syntax'
    | 'encoding_depth'
    | 'no_items'
    | 'file_read'
    | 'out_of_memory'
    | 'stack_overflow'
    | 'worker_crash'
    | 'worker_unavailable'
    | 'flatten_failed'
    | 'chunk_load'
    | 'unknown';

const RULES: Array<[RegExp, TelemetryErrorType]> = [
    [/input is empty/i, 'empty_input'],
    // Must precede every JSON rule. A chunk-load failure quotes the asset URL,
    // and our own host name contains "json", so a looser rule below would
    // otherwise book an app-delivery failure as the user's bad syntax.
    [
        /loading chunk \S+ failed|chunkloaderror|(failed to fetch|error loading) dynamically imported module|importing a module script failed/i,
        'chunk_load',
    ],
    [/looks like an HTML page/i, 'not_json_html'],
    [/looks like XML/i, 'not_json_xml'],
    [/looks like CSV/i, 'not_json_csv'],
    [/maximum recursion depth/i, 'encoding_depth'],
    [/no data items/i, 'no_items'],
    [/file read error|NotReadableError|NotFoundError/i, 'file_read'],
    [/out of memory|allocation failed|invalid string length|invalid array length/i, 'out_of_memory'],
    [/maximum call stack|too much recursion/i, 'stack_overflow'],
    [/unexpected end|end of (json )?(data|input)|unterminated|incomplete/i, 'json_truncated'],
    [
        // Anchored on real parser phrasing rather than a bare "json", which
        // matched any message that merely mentioned a JSON-named URL or file.
        /is not valid json|json parse error|in json at position|of the json data|unexpected (token|character|identifier|non-whitespace)|expected .* after|bad control character/i,
        'json_syntax',
    ],
];

export function classifyErrorMessage(message: string | null | undefined): TelemetryErrorType {
    if (!message) return 'unknown';
    for (const [pattern, type] of RULES) {
        if (pattern.test(message)) return type;
    }
    return 'unknown';
}

const MAX_MESSAGE_LENGTH = 200;
const QUOTED_SPAN = /'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
const PUNCTUATION_SPAN = /^(['`])[,:;{}[\]()]\1$/;
// Private-use code point: cannot occur in an engine error message.
const MARK = '';
const PLACEHOLDER = new RegExp(`${MARK}(\\d+)${MARK}`, 'g');

/**
 * Removes anything that could be user content: quoted spans and long
 * unbroken tokens. Positions, line and column numbers are kept because they
 * are what makes a parse error debuggable.
 */
export function redactErrorMessage(message: string | null | undefined): string {
    if (!message) return '';

    // Engines use double quotes only around input (V8's snippet, Safari's
    // identifier), and V8 does not escape quotes inside its snippet
    // (`"{"email":"jane@x.com"}" is not valid JSON`), so pair-matching would
    // leak it. Double-quoted text is therefore always dropped whole. Single-
    // quoted and backticked spans are engine tokens: kept when they are one
    // punctuation character (`Expected ',' or '}'` is the useful part of that
    // message), redacted otherwise. Placeholders are quote-free, so any quote
    // left afterwards belongs to a snippet the engine cut short.
    const spans: string[] = [];
    const hold = (span: string) => {
        spans.push(PUNCTUATION_SPAN.test(span) ? span : `${span[0]}…${span[0]}`);
        return `${MARK}${spans.length - 1}${MARK}`;
    };

    const redacted = String(message)
        .replace(/"[\s\S]*"(?=\s+is not valid JSON)/, hold)
        .replace(/"[\s\S]*$/, hold('""'))
        .replace(QUOTED_SPAN, hold)
        .replace(/['`][\s\S]*$/, '…')
        .replace(/\S{40,}/g, '…')
        .replace(PLACEHOLDER, (_, i: string) => spans[Number(i)])
        .replace(/\s+/g, ' ')
        .trim();
    return redacted.length > MAX_MESSAGE_LENGTH ? `${redacted.slice(0, MAX_MESSAGE_LENGTH - 1)}…` : redacted;
}
