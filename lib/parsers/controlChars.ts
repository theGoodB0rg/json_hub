/**
 * Escaping raw control characters (U+0000–U+001F) inside JSON string literals.
 *
 * Exported logs and free-text fields often carry literal tabs and line breaks
 * inside strings. That is invalid JSON ("Bad control character in string
 * literal") but unambiguous to repair: escape them the way the writer should
 * have. Whitespace between tokens is left alone.
 *
 * The escaper is stateful so the streaming parser can feed it a file chunk by
 * chunk: a string that opens in one chunk and closes in the next is tracked
 * across the boundary.
 */

const NAMED: Record<number, string> = { 8: '\\b', 9: '\\t', 10: '\\n', 12: '\\f', 13: '\\r' };

function escapeCode(code: number): string {
    return NAMED[code] ?? '\\u' + code.toString(16).padStart(4, '0');
}

export interface ControlCharEscaper {
    /** Returns the chunk with control characters inside strings escaped. */
    push(chunk: string): string;
    /** True once any character has been escaped. */
    readonly changed: boolean;
}

export function createControlCharEscaper(): ControlCharEscaper {
    let inString = false;
    let escaped = false;
    let changed = false;

    return {
        get changed() {
            return changed;
        },
        // Runs on every chunk of every streamed file, so it jumps between the
        // characters that matter with native searches instead of visiting each
        // one: indexOf('"') outside strings, a regex for '"', '\' and control
        // characters inside them.
        push(chunk: string): string {
            let out: string[] | null = null;
            let last = 0;
            let i = 0;
            const special = /["\\\u0000-\u001f]/g;
            while (i < chunk.length) {
                if (escaped) {
                    // The character after a backslash is part of the escape.
                    escaped = false;
                    i++;
                    continue;
                }
                if (!inString) {
                    const quote = chunk.indexOf('"', i);
                    if (quote === -1) break;
                    inString = true;
                    i = quote + 1;
                    continue;
                }
                special.lastIndex = i;
                const match = special.exec(chunk);
                if (!match) break;
                const at = match.index;
                const code = chunk.charCodeAt(at);
                if (code === 34 /* " */) {
                    inString = false;
                } else if (code === 92 /* \ */) {
                    escaped = true;
                } else {
                    out ??= [];
                    out.push(chunk.slice(last, at), escapeCode(code));
                    last = at + 1;
                    changed = true;
                }
                i = at + 1;
            }
            if (!out) return chunk;
            out.push(chunk.slice(last));
            return out.join('');
        },
    };
}

/** Whole-string form. Returns null when there was nothing to escape. */
export function escapeControlCharsInStrings(input: string): string | null {
    const escaper = createControlCharEscaper();
    const result = escaper.push(input);
    return escaper.changed ? result : null;
}
