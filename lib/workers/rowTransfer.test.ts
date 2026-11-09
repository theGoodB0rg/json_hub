import v8 from 'v8';
import { flattenJSON } from '@/lib/parsers/flattener';
import { packRows, unpackRows } from './rowTransfer';

describe('rowTransfer', () => {
    it('round-trips flattened rows exactly, nulls and column order included', () => {
        const { rows, schema } = flattenJSON([
            { id: 1, user: { name: 'Ada', tags: ['a', 'b'] }, note: null },
            { id: 2, extra: 0, flag: false, text: '' },
        ]);

        const back = unpackRows(packRows(rows, schema));

        expect(back).toEqual(rows);
        expect(Object.keys(back[1])).toEqual(schema);
        expect(back[1]['user.name']).toBeNull();
        expect(back[1].extra).toBe(0);
        expect(back[1].flag).toBe(false);
        expect(back[1].text).toBe('');
    });

    it('fills a cell missing from the row with null, not undefined', () => {
        const back = unpackRows(packRows([{ a: 1 }], ['a', 'b']));
        expect(back).toEqual([{ a: 1, b: null }]);
    });

    it('handles no rows', () => {
        expect(unpackRows(packRows([], ['a']))).toEqual([]);
    });

    // The bug: a sparse file flattens to thousands of null-filled columns, and
    // cloning row objects repeats every column name in every row.
    it('makes the cloned payload of a sparse, wide file much smaller', () => {
        const data = Array.from({ length: 1500 }, (_, i) => ({
            id: i,
            items: Array.from({ length: (i % 100) + 1 }, (_, j) => ({ sku: 'S' + j, q: j })),
        }));
        const { rows, schema } = flattenJSON(data);
        expect(schema.length).toBeGreaterThan(150);

        const asObjects = v8.serialize({ rows, schema }).length;
        const packed = v8.serialize(packRows(rows, schema)).length;

        // ~3x at this width; the saving grows with the column count.
        expect(packed * 2).toBeLessThan(asObjects);
    });
});
