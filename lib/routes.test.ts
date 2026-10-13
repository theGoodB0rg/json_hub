import { toAbsoluteUrl, SITE_ORIGIN } from './routes';

describe('toAbsoluteUrl', () => {
    it('builds absolute URLs from relative paths', () => {
        expect(toAbsoluteUrl('/converters/stripe-json-to-excel')).toBe(
            `${SITE_ORIGIN}/converters/stripe-json-to-excel`
        );
    });

    it('adds a leading slash when missing', () => {
        expect(toAbsoluteUrl('blog/foo')).toBe(`${SITE_ORIGIN}/blog/foo`);
    });

    it('never emits doubled origins for absolute-URL input (GSC 404 regression)', () => {
        expect(
            toAbsoluteUrl('https://jsonexport.com/converters/stripe-json-to-excel')
        ).toBe(`${SITE_ORIGIN}/converters/stripe-json-to-excel`);
    });

    it('defaults to the homepage', () => {
        expect(toAbsoluteUrl()).toBe(`${SITE_ORIGIN}/`);
        expect(toAbsoluteUrl('')).toBe(`${SITE_ORIGIN}/`);
    });
});
