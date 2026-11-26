import { parseAndFlatten } from './pipeline';

describe('parseAndFlatten', () => {
    it('parses, unwraps and flattens in one call', () => {
        const out = parseAndFlatten('{"results":[{"id":1,"user":{"name":"Ada"}}]}');
        expect(out).toEqual({ ok: true, rows: [{ id: 1, 'user.name': 'Ada' }], schema: ['id', 'user.name'] });
    });

    it('handles escaped (double-encoded) JSON', () => {
        const out = parseAndFlatten(JSON.stringify(JSON.stringify([{ a: 1 }])));
        expect(out.ok && out.rows).toEqual([{ a: 1 }]);
    });

    it('reports parse errors instead of throwing', () => {
        const out = parseAndFlatten('');
        expect(out.ok).toBe(false);
    });
});
