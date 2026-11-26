import type { FlattenResult } from '@/types/parser.types';
import type { FlattenMode } from '@/lib/parsers/platform/types';
import { validateAndParse } from '@/lib/parsers/smartParse';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import { flattenJSON } from '@/lib/parsers/flattener';

export type PipelineResult =
    | ({ ok: true } & FlattenResult)
    | { ok: false; error: string };

/**
 * Raw text to spreadsheet rows, in the same three steps the web app runs:
 * tolerant parse (escaped / JSON Lines / BOM), unwrap the API envelope,
 * then flatten. Pure and synchronous, so any runtime can call it.
 */
export function parseAndFlatten(raw: string, mode: FlattenMode = 'flat'): PipelineResult {
    const parsed = validateAndParse(raw);
    if (!parsed.success) {
        return { ok: false, error: parsed.errors?.[0]?.message ?? 'Could not parse the input as JSON' };
    }
    const { data } = smartUnwrap(parsed.data, mode);
    const { rows, schema } = flattenJSON(data, { mode });
    return { ok: true, rows, schema };
}
