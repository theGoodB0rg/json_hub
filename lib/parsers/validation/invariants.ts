/**
 * Conversion invariants.
 *
 * "Don't merely parse — validate to the point we can't possibly be incorrect."
 *
 * Unit tests check that known inputs produce known outputs. That catches
 * regressions in cases somebody thought of. It does not catch the failure
 * that actually reached users: a Jira export where every value was present
 * and correct, spread over 851 columns, which the user read as data loss.
 *
 * These invariants are different in kind. They are properties that must hold
 * for *every* input, checked against real third-party payloads, so a new
 * platform parser cannot silently drop a field or multiply rows. They are the
 * difference between "the tests we wrote pass" and "this cannot be wrong".
 *
 * The invariants:
 *
 *   1. LOSSLESS      every scalar leaf in the input is recoverable from the
 *                    output, except values a parser explicitly declares it
 *                    omits. Dropping data must be a deliberate, reviewed act.
 *   2. NO_INFLATION  row count matches the number of source records. Catches
 *                    the Cartesian explosion class of bug directly.
 *   3. RECTANGULAR   every row exposes the same column set.
 *   4. NO_CORRUPTION no "[object Object]", no "undefined"/"NaN" cells — the
 *                    signatures of a value mangled on the way out.
 *   5. DETERMINISTIC the same input converts to byte-identical output twice.
 *   6. DENSE         the sheet is not mostly empty (a soft budget: a 41%-full
 *                    sheet is the symptom users reported as "missing data").
 */

export interface Leaf {
    path: string;
    value: string | number | boolean;
}

export interface InvariantViolation {
    invariant: string;
    detail: string;
    /** A few concrete examples. Never the whole list — these run over real data. */
    samples: string[];
    count: number;
}

export interface InvariantOptions {
    /**
     * Input paths whose values the parser is allowed to drop, matched against
     * the dotted leaf path with array indices normalised to `[]`.
     *
     * Two forms:
     *   `issues[].changelog`  prefix — that subtree may be dropped
     *   `*.avatarUrls`        suffix — that key may be dropped anywhere
     *
     * The suffix form exists because the noise is structural, not positional:
     * `self`, `iconUrl` and `avatarUrls` appear on every nested Jira object,
     * and enumerating all 540 concrete paths would be unreviewable. Every
     * entry is a deliberate decision. Anything NOT listed here must survive.
     */
    allowedOmissions?: readonly string[];
    /** Expected row count. When omitted, NO_INFLATION is skipped. */
    expectedRows?: number;
    /** Minimum acceptable cell fill rate, 0..1. Default 0.5. */
    minFillRate?: number;
    /** Values too generic to track (they collide across the payload). */
    ignoreValues?: ReadonlySet<string>;

    /**
     * Additional output tables a value may legitimately live in.
     *
     * A platform parser offers more than one grain of the same data — Jira's
     * wide grain gives one row per issue and condenses a 5KB description edit
     * to a readable summary line, while its long grain keeps every change
     * verbatim. Checking either grain alone would report the other's detail as
     * "lost". The honest claim is that nothing disappears from the product,
     * so losslessness is checked against the union of the grains.
     */
    alsoPresentIn?: readonly Record<string, any>[][];
}

/** Values that carry no information and collide constantly across a payload. */
const DEFAULT_IGNORED = new Set(['', 'true', 'false', '0', '1', '-1', 'null', 'undefined']);

function normalisePath(path: string): string {
    return path.replace(/\[\d+\]/g, '[]');
}

/** Collect every scalar leaf, with its structural path. */
export function collectLeaves(data: unknown, path = '', out: Leaf[] = []): Leaf[] {
    if (data === null || data === undefined) return out;

    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) collectLeaves(data[i], `${path}[${i}]`, out);
        return out;
    }

    if (typeof data === 'object') {
        for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
            collectLeaves(v, path ? `${path}.${k}` : k, out);
        }
        return out;
    }

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        out.push({ path, value: data });
    }
    return out;
}

/**
 * Index every value reachable from the output rows.
 *
 * Two indexes, because a value can survive in two different shapes:
 *   exact   — the cell holds the value outright
 *   joined  — the cell holds it inside a delimited or JSON-encoded string
 *             ("Core, Clients, Consumer"), which is still recoverable
 */
function indexOutput(rows: Record<string, any>[]): { exact: Set<string>; haystack: string } {
    const exact = new Set<string>();
    const parts: string[] = [];

    for (const row of rows) {
        for (const v of Object.values(row)) {
            if (v === null || v === undefined) continue;
            const s = typeof v === 'string' ? v : String(v);
            exact.add(s);
            // Trim is needed because joined cells pad with ", ".
            exact.add(s.trim());
            parts.push(s);
        }
    }
    return { exact, haystack: parts.join('\u0000') };
}


/**
 * Does `path` fall under a declared omission?
 *   prefix form  "a.b"      matches "a.b", "a.b.c", "a.b[]"
 *   suffix form  "*.k"      matches any path whose key chain ends in ".k",
 *                           and the subtree beneath it
 *   wildcard     "a.*.k"    matches one path segment, e.g. "a.assignee.k"
 *                           and "a.status.k" but not "a.b.c.k"
 */
export function isOmissionAllowed(path: string, allowed: readonly string[]): boolean {
    for (const rule of allowed) {
        if (rule.startsWith('*.')) {
            const key = rule.slice(2);
            // ".key" anywhere in the chain, or the whole path being that key.
            if (path === key) return true;
            const needle = '.' + key;
            let idx = path.indexOf(needle);
            while (idx !== -1) {
                const after = path.slice(idx + needle.length);
                // Matches the key itself, or anything nested under it.
                if (after === '' || after.startsWith('.') || after.startsWith('[')) return true;
                idx = path.indexOf(needle, idx + 1);
            }
            continue;
        }
        if (rule.includes('.*.')) {
            // One segment stands in for the wildcard; array markers are part
            // of a segment, so "fields.*.key" matches "fields.versions[].key".
            const pattern = rule
                .split('.')
                .map((seg) =>
                    seg === '*' ? '[^.]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                )
                .join('\\.');
            if (new RegExp(`^${pattern}(\\.|\\[|$)`).test(path)) return true;
            continue;
        }
        if (path === rule || path.startsWith(rule + '.') || path.startsWith(rule + '[')) return true;
    }
    return false;
}

export function checkLossless(
    input: unknown,
    rows: Record<string, any>[],
    options: InvariantOptions = {}
): InvariantViolation | null {
    const allowed = options.allowedOmissions ?? [];
    const ignore = options.ignoreValues ?? DEFAULT_IGNORED;
    const { exact, haystack } = indexOutput([
        ...rows,
        ...(options.alsoPresentIn ?? []).flat(),
    ]);

    const missing: string[] = [];
    let count = 0;

    for (const leaf of collectLeaves(input)) {
        const norm = normalisePath(leaf.path);
        if (isOmissionAllowed(norm, allowed)) continue;

        const raw = String(leaf.value);
        if (ignore.has(raw)) continue;
        // Very short values collide with substrings of unrelated cells and
        // produce false passes, not false failures — skipping them keeps the
        // check honest in the strict direction.
        if (raw.length < 2) continue;

        if (exact.has(raw) || exact.has(raw.trim())) continue;
        if (haystack.includes(raw)) continue;

        count++;
        if (missing.length < 8) missing.push(`${norm} = ${JSON.stringify(raw).slice(0, 90)}`);
    }

    if (count === 0) return null;
    return {
        invariant: 'LOSSLESS',
        detail: `${count} input value(s) are not recoverable from the output and are not declared as intentional omissions`,
        samples: missing,
        count,
    };
}

export function checkNoInflation(
    rows: Record<string, any>[],
    expectedRows: number | undefined
): InvariantViolation | null {
    if (expectedRows === undefined) return null;
    if (rows.length === expectedRows) return null;
    return {
        invariant: 'NO_INFLATION',
        detail: `expected ${expectedRows} row(s) for the source records, produced ${rows.length}`,
        samples: [`ratio ${(rows.length / Math.max(expectedRows, 1)).toFixed(2)}x`],
        count: Math.abs(rows.length - expectedRows),
    };
}

export function checkRectangular(rows: Record<string, any>[]): InvariantViolation | null {
    if (rows.length === 0) return null;
    const expected = Object.keys(rows[0]).sort().join('\u0000');
    const offenders: string[] = [];
    let count = 0;

    for (let i = 1; i < rows.length; i++) {
        const actual = Object.keys(rows[i]).sort().join('\u0000');
        if (actual !== expected) {
            count++;
            if (offenders.length < 5) {
                const missing = Object.keys(rows[0]).filter((k) => !(k in rows[i]));
                const extra = Object.keys(rows[i]).filter((k) => !(k in rows[0]));
                offenders.push(
                    `row ${i}: missing [${missing.slice(0, 4).join(', ')}] extra [${extra.slice(0, 4).join(', ')}]`
                );
            }
        }
    }

    if (count === 0) return null;
    return { invariant: 'RECTANGULAR', detail: `${count} row(s) differ in shape from row 0`, samples: offenders, count };
}

const CORRUPTION_SIGNATURES = ['[object Object]', '[object Array]', 'NaN', 'undefined'];

export function checkNoCorruption(rows: Record<string, any>[]): InvariantViolation | null {
    const offenders: string[] = [];
    let count = 0;

    for (let i = 0; i < rows.length; i++) {
        for (const [k, v] of Object.entries(rows[i])) {
            if (typeof v !== 'string') {
                // A real NaN is corruption too — JSON has no NaN, so any NaN
                // in the output was produced by our own arithmetic.
                if (typeof v === 'number' && Number.isNaN(v)) {
                    count++;
                    if (offenders.length < 8) offenders.push(`row ${i} col "${k}" = NaN`);
                }
                continue;
            }
            if (CORRUPTION_SIGNATURES.some((sig) => v === sig || v.includes(sig))) {
                count++;
                if (offenders.length < 8) offenders.push(`row ${i} col "${k}" = ${JSON.stringify(v.slice(0, 60))}`);
            }
        }
    }

    if (count === 0) return null;
    return { invariant: 'NO_CORRUPTION', detail: `${count} cell(s) contain a value-mangling signature`, samples: offenders, count };
}

export function checkFillRate(
    rows: Record<string, any>[],
    minFillRate: number
): InvariantViolation | null {
    if (rows.length === 0) return null;
    const cols = Object.keys(rows[0]);
    if (cols.length === 0) return null;

    let filled = 0;
    for (const row of rows) {
        for (const c of cols) {
            const v = row[c];
            if (v !== null && v !== undefined && v !== '') filled++;
        }
    }
    const total = rows.length * cols.length;
    const rate = filled / total;
    if (rate >= minFillRate) return null;

    return {
        invariant: 'DENSE',
        detail: `cell fill rate ${(rate * 100).toFixed(1)}% is below the ${(minFillRate * 100).toFixed(0)}% budget (${rows.length} rows x ${cols.length} cols)`,
        samples: [
            `empty-in-every-row columns: ${cols
                .filter((c) => rows.every((r) => r[c] === null || r[c] === undefined || r[c] === ''))
                .slice(0, 8)
                .join(', ') || '(none)'}`,
        ],
        count: Math.round((minFillRate - rate) * total),
    };
}

export function checkDeterministic(
    produce: () => Record<string, any>[]
): InvariantViolation | null {
    const a = JSON.stringify(produce());
    const b = JSON.stringify(produce());
    if (a === b) return null;
    return {
        invariant: 'DETERMINISTIC',
        detail: 'two conversions of the same input produced different output',
        samples: [`first run ${a.length} bytes, second ${b.length} bytes`],
        count: 1,
    };
}

/** Run every invariant and return all violations. */
export function checkAll(
    input: unknown,
    produce: () => Record<string, any>[],
    options: InvariantOptions = {}
): InvariantViolation[] {
    const rows = produce();
    return [
        checkLossless(input, rows, options),
        checkNoInflation(rows, options.expectedRows),
        checkRectangular(rows),
        checkNoCorruption(rows),
        checkFillRate(rows, options.minFillRate ?? 0.5),
        checkDeterministic(produce),
    ].filter((v): v is InvariantViolation => v !== null);
}

export function formatViolations(violations: InvariantViolation[]): string {
    return violations
        .map((v) => `  ✗ ${v.invariant}: ${v.detail}\n${v.samples.map((s) => `      ${s}`).join('\n')}`)
        .join('\n');
}
