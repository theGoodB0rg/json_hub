import { chatSummary, convertForChat, LIMITS, SITE_ORIGIN } from './convert';
import { readSharePayload } from '@/lib/utils/shareLink';

const orders = JSON.stringify({
    data: [
        { id: 1, customer: { name: 'Ada', city: 'Lagos' }, total: 12.5 },
        { id: 2, customer: { name: 'Bayo, Jr.', city: 'Ibadan' }, total: 7 },
    ],
});

function ok(json: string) {
    const out = convertForChat(json);
    if (!out.ok) throw new Error(out.error);
    return out.value;
}

describe('convertForChat', () => {
    it('unwraps the API envelope and flattens nested fields like the website', () => {
        const c = ok(orders);
        expect(c.rowCount).toBe(2);
        expect(c.columns).toEqual(expect.arrayContaining(['id', 'customer.name', 'customer.city', 'total']));
        expect(c.previewRows[0]['customer.city']).toBe('Lagos');
    });

    it('writes Excel-friendly CSV with a BOM and proper quoting', () => {
        const c = ok(orders);
        expect(c.csv.startsWith('﻿')).toBe(true);
        expect(c.csv).toContain('"Bayo, Jr."');
        expect(c.csvTruncated).toBe(false);
    });

    it('links to jsonexport.com with the data in the fragment and a ref tag', () => {
        const c = ok(orders);
        expect(c.openUrl).toMatch(new RegExp(`^${SITE_ORIGIN}/\\?ref=mcp#share=`));
        const url = new URL(c.openUrl!);
        expect(readSharePayload(url.hash, url.search)).toBe(orders);
    });

    it('accepts JSON Lines', () => {
        expect(ok('{"a":1}\n{"a":2}\n{"a":3}').rowCount).toBe(3);
    });

    it('cuts long CSV at a row boundary and says so', () => {
        const rows = Array.from({ length: 4000 }, (_, i) => ({ id: i, note: 'x'.repeat(20) }));
        const c = ok(JSON.stringify(rows));
        expect(c.rowCount).toBe(4000);
        expect(c.csvTruncated).toBe(true);
        expect(c.csv.length).toBeLessThanOrEqual(LIMITS.maxInlineCsvChars);
        expect(c.csv.endsWith('\n')).toBe(false);
        expect(chatSummary(c)).toContain('first rows only');
    });

    it('drops the link when the data is too big for a URL, and points to the site instead', () => {
        const rows = Array.from({ length: 3000 }, () => ({ v: Math.random().toString(36) }));
        const c = ok(JSON.stringify(rows));
        expect(c.openUrl).toBeNull();
        expect(chatSummary(c)).toContain(`open ${SITE_ORIGIN} and paste or drop`);
    });

    it('shortens long cells in the preview only', () => {
        const c = ok(JSON.stringify([{ text: 'y'.repeat(500) }]));
        expect(c.previewRows[0].text.length).toBe(LIMITS.previewCellChars);
        expect(c.csv).toContain('y'.repeat(500));
    });

    it('returns a readable error for invalid or empty input', () => {
        expect(convertForChat('{not json').ok).toBe(false);
        expect(convertForChat('[]')).toEqual({ ok: false, error: expect.stringMatching(/no records/) });
    });

    it('rejects input over the size cap with a pointer to the website', () => {
        const out = convertForChat(' '.repeat(LIMITS.maxInputChars + 1));
        expect(out.ok).toBe(false);
        if (!out.ok) expect(out.error).toContain(SITE_ORIGIN);
    });
});
