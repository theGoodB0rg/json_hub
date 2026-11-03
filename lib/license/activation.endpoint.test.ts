import { resolveLicenseEndpoint } from './activation';

describe('resolveLicenseEndpoint', () => {
    it('uses the explicit override when set', () => {
        expect(resolveLicenseEndpoint('http://localhost:8787', undefined)).toBe('http://localhost:8787');
    });

    it('stays same-origin on the website', () => {
        expect(
            resolveLicenseEndpoint(undefined, {
                protocol: 'https:',
                hostname: 'jsonexport.com',
                origin: 'https://jsonexport.com',
            }),
        ).toBe('https://jsonexport.com/_l');
    });

    it('goes to production from the Windows desktop webview', () => {
        expect(
            resolveLicenseEndpoint(undefined, {
                protocol: 'http:',
                hostname: 'tauri.localhost',
                origin: 'http://tauri.localhost',
            }),
        ).toBe('https://jsonexport.com/_l');
    });

    it('goes to production from the macOS/Linux desktop webview', () => {
        expect(
            resolveLicenseEndpoint(undefined, { protocol: 'tauri:', hostname: 'localhost', origin: 'tauri://localhost' }),
        ).toBe('https://jsonexport.com/_l');
    });
});
