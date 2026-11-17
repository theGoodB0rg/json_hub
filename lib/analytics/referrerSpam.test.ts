import { isReferrerSpam } from './referrerSpam';

describe('isReferrerSpam', () => {
    it('flags the spam domain and its subdomains', () => {
        expect(isReferrerSpam('https://www.aocr.org/')).toBe(true);
        expect(isReferrerSpam('https://aocr.org/x')).toBe(true);
    });

    it('keeps real referrers and lookalikes', () => {
        expect(isReferrerSpam('https://www.google.com/')).toBe(false);
        expect(isReferrerSpam('https://notaocr.org/')).toBe(false);
        expect(isReferrerSpam('(direct)')).toBe(false);
        expect(isReferrerSpam('app:store')).toBe(false);
        expect(isReferrerSpam(null)).toBe(false);
    });
});
