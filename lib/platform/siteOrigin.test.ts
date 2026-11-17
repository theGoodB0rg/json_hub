const invoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({ invoke: (...a: unknown[]) => invoke(...a) }));

import { siteOrigin, desktopReferrer, detectDesktopChannel } from './siteOrigin';
import { resolveEndpoints, _setBuildToken } from '@/lib/telemetry/endpoints';

const web = { protocol: 'https:', hostname: 'jsonexport.com', origin: 'https://jsonexport.com' };
const windowsApp = { protocol: 'http:', hostname: 'tauri.localhost', origin: 'http://tauri.localhost' };
const macApp = { protocol: 'tauri:', hostname: 'localhost', origin: 'tauri://localhost' };

describe('siteOrigin', () => {
    it('keeps the website same-origin', () => {
        expect(siteOrigin(web)).toBe('https://jsonexport.com');
    });

    it('sends the desktop app to production', () => {
        expect(siteOrigin(windowsApp)).toBe('https://jsonexport.com');
        expect(siteOrigin(macApp)).toBe('https://jsonexport.com');
    });

    it('REGRESSION: desktop telemetry no longer posts to tauri.localhost', () => {
        _setBuildToken('tok');
        expect(resolveEndpoints(siteOrigin(windowsApp)).firstPartyIngest).toBe('https://jsonexport.com/_i/tok/i');
    });
});

describe('desktop channel tag', () => {
    it('is null on the website', () => {
        expect(desktopReferrer(web)).toBeNull();
    });

    it('tags Store and GitHub installs apart', async () => {
        expect(desktopReferrer(windowsApp)).toBe('app:desktop');
        invoke.mockResolvedValueOnce(true);
        await detectDesktopChannel();
        expect(desktopReferrer(windowsApp)).toBe('app:store');
        invoke.mockRejectedValueOnce(new Error('no command'));
        await detectDesktopChannel();
        expect(desktopReferrer(windowsApp)).toBe('app:github');
    });
});
