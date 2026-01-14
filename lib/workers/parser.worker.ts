import { validateAndParse } from '@/lib/parsers/smartParse';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';

const ctx: Worker = self as any;

ctx.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    try {
        if (type === 'PARSE') {
            const rawInput = payload;
            const parseResult = validateAndParse(rawInput);

            if (parseResult.success) {
                ctx.postMessage({
                    type: 'PARSE_SUCCESS',
                    payload: parseResult.data
                });

                // Automatically trigger flatten after parse for efficiency if needed,
                // but usually the store orchestrates this.
                // For now, just return parse result.
            } else {
                ctx.postMessage({
                    type: 'PARSE_ERROR',
                    payload: parseResult.errors
                });
            }
        } else if (type === 'FLATTEN') {
            const { data, mode } = payload;

            // Smart unwrap logic (moved from store to worker for consistency if data is huge)
            // Note: smartUnwrap is fast but if data is massive, better here.
            const { data: dataToFlatten } = smartUnwrap(data);

            const result = flattenJSON(dataToFlatten, { mode });

            ctx.postMessage({
                type: 'FLATTEN_SUCCESS',
                payload: {
                    rows: result.rows,
                    schema: result.schema
                }
            });
        }
    } catch (error) {
        ctx.postMessage({
            type: 'ERROR',
            payload: [{ message: error instanceof Error ? error.message : 'Unknown worker error' }]
        });
    }
});
