import {
    chooseUpsellVariant,
    checkoutSourceFor,
    isUpsellVariant,
    formatMegabytes,
    LARGE_EXPORT_BYTES,
} from './upsell-variant';

describe('chooseUpsellVariant', () => {
    it('picks large from the file size, ahead of history', () => {
        expect(chooseUpsellVariant({ fileSizeBytes: LARGE_EXPORT_BYTES, priorExports: 0 })).toBe('large');
        expect(chooseUpsellVariant({ fileSizeBytes: 5_000_000, priorExports: 9 })).toBe('large');
    });

    it('picks returning for a small file from someone who has exported before', () => {
        expect(chooseUpsellVariant({ fileSizeBytes: 140_000, priorExports: 1 })).toBe('returning');
    });

    it('picks first for a small file from a first-time exporter', () => {
        expect(chooseUpsellVariant({ fileSizeBytes: 140_000, priorExports: 0 })).toBe('first');
    });

    it('falls back on history alone when the size is unknown', () => {
        expect(chooseUpsellVariant({ priorExports: 0 })).toBe('first');
        expect(chooseUpsellVariant({ priorExports: 2 })).toBe('returning');
    });

    it('treats a size just under the threshold as small', () => {
        expect(chooseUpsellVariant({ fileSizeBytes: LARGE_EXPORT_BYTES - 1, priorExports: 0 })).toBe('first');
    });
});

describe('upsell variant helpers', () => {
    it('builds a distinct checkout source per variant', () => {
        expect(checkoutSourceFor('large')).toBe('post_export_upsell_large');
        expect(checkoutSourceFor('first')).not.toBe(checkoutSourceFor('returning'));
    });

    it('recognises only known variants', () => {
        expect(isUpsellVariant('returning')).toBe(true);
        expect(isUpsellVariant('xlsx')).toBe(false);
        expect(isUpsellVariant(undefined)).toBe(false);
    });

    it('formats sizes without trailing noise on big files', () => {
        expect(formatMegabytes(1.5 * 1024 * 1024)).toBe('1.5');
        expect(formatMegabytes(250 * 1024 * 1024)).toBe('250');
    });
});
