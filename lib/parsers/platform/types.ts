/**
 * Shared contract for platform-aware pre-processors.
 *
 * A platform parser exists for one reason: the generic flattener is correct
 * but domain-blind. Given a Jira issue-search payload it will faithfully
 * produce 851 sparse columns for 5 issues, and given a Trello board it will
 * multiply cards by checklists by labels. Both outputs are *accurate* and
 * both are useless in a spreadsheet.
 *
 * A parser's job is to pick the right grain (what is one row?) and to
 * surface the fields a human actually came for, without inventing or
 * discarding data. The invariant suite in lib/parsers/validation enforces
 * the "without discarding" half.
 */

export type FlattenMode = 'flat' | 'relational';

export interface PlatformParser<T = any> {
    /** Stable id, also used as the telemetry `platform` value. */
    readonly id: string;

    /** Human label for UI and error messages. */
    readonly label: string;

    /**
     * Cheap structural check. MUST be side-effect free and MUST NOT throw on
     * arbitrary input — it is called on every payload the user pastes.
     * Prefer under-matching: a false positive silently reshapes a user's data,
     * which is far worse than falling back to the generic flattener.
     */
    detect(data: unknown): data is T;

    /**
     * Reshape into spreadsheet rows.
     *
     * `mode` mirrors the flattener's own modes and lets a parser offer two
     * genuinely different grains. For Jira: 'flat' is one row per issue,
     * 'relational' is one row per changelog entry (the audit trail).
     */
    transform(data: T, mode: FlattenMode): Record<string, any>[];

    /**
     * Columns the parser guarantees to emit when the corresponding source
     * data is present. Used by tests as a contract, not by runtime code.
     */
    readonly guaranteedColumns?: readonly string[];

    /**
     * Input paths this parser deliberately does not carry into the sheet,
     * in the pattern language of lib/parsers/validation/invariants.
     *
     * This is a contract, not a convenience: the LOSSLESS invariant fails on
     * any value that disappears without being declared here. Adding an entry
     * is how you say "yes, I meant to drop that" — and it shows up in review
     * as a diff on the parser, which is exactly where that argument belongs.
     */
    readonly intentionalOmissions?: readonly string[];
}

/** Join array-ish values into a single readable cell without losing entries. */
export function joinCell(values: Array<string | null | undefined>, sep = ', '): string {
    return values.filter((v): v is string => typeof v === 'string' && v.length > 0).join(sep);
}

/**
 * Drop columns that are empty in every row.
 *
 * Real exports are mostly empty: an Apache Jira issue carries 125 field slots
 * of which 31 hold anything. Keeping the other 94 produces a sheet that is
 * 75% blank and hides the columns that matter. Nothing is lost — a column
 * removed here held no value in any row, by construction.
 */
export function dropEmptyColumns(rows: Record<string, any>[]): Record<string, any>[] {
    if (rows.length === 0) return rows;

    const keep = new Set<string>();
    for (const row of rows) {
        for (const [k, v] of Object.entries(row)) {
            if (v !== null && v !== undefined && v !== '') keep.add(k);
        }
    }

    return rows.map((row) => {
        const out: Record<string, any> = {};
        for (const k of Object.keys(row)) {
            if (keep.has(k)) out[k] = row[k];
        }
        return out;
    });
}
