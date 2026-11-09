// Moving flattened rows between the parser worker and the page.
//
// postMessage copies its payload with the structured clone algorithm, which
// writes every property name of every object into one buffer. Flattened rows
// carry every column (missing cells are null), so a sparse file with a few
// thousand columns repeats each column name once per row and the copy runs
// out of memory ("Data cannot be cloned, out of memory") on files well under
// the free limit. Sending the column names once and each row as a plain array
// keeps the copy close to the size of the values themselves.

export interface PackedRows {
    schema: string[];
    cells: unknown[][];
}

export function packRows(rows: Record<string, unknown>[], schema: string[]): PackedRows {
    const cells = new Array<unknown[]>(rows.length);
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const out = new Array<unknown>(schema.length);
        for (let c = 0; c < schema.length; c++) {
            const value = row[schema[c]];
            out[c] = value === undefined ? null : value;
        }
        cells[r] = out;
    }
    return { schema, cells };
}

export function unpackRows({ schema, cells }: PackedRows): Record<string, unknown>[] {
    const rows = new Array<Record<string, unknown>>(cells.length);
    for (let r = 0; r < cells.length; r++) {
        const values = cells[r];
        const row: Record<string, unknown> = {};
        for (let c = 0; c < schema.length; c++) {
            row[schema[c]] = values[c];
        }
        rows[r] = row;
    }
    return rows;
}
