import { platformAdapter } from './PlatformAdapter';
import { WebEngine } from './WebEngine';
import { DesktopEngine } from './DesktopEngine';

describe('PlatformAdapter', () => {
    const originalWindow = global.window;

    afterEach(() => {
        // @ts-ignore
        delete (global as any).window;
        // @ts-ignore
        global.window = originalWindow;
    });

    test('defaults to WebEngine in standard browser / non-tauri environment', async () => {
        // Mock standard browser environment without tauri internals
        // @ts-ignore
        global.window = {
            navigator: { platform: 'Win32' },
        } as any;

        const isDesktop = platformAdapter.isDesktopEnvironment();
        expect(isDesktop).toBe(false);

        const engine = platformAdapter.getEngine();
        expect(engine.isDesktop).toBe(false);
        const env = await engine.getEnvironmentInfo();
        expect(env.isDesktop).toBe(false);
        expect(env.streamingSupported).toBe(false);
    });

    test('detects DesktopEngine when __TAURI_INTERNALS__ is present', () => {
        // @ts-ignore
        global.window = {
            __TAURI_INTERNALS__: {},
            navigator: { platform: 'Win32' },
        } as any;

        // Reset singleton internal state for testing
        // @ts-ignore
        platformAdapter.engineInstance = null;

        const isDesktop = platformAdapter.isDesktopEnvironment();
        expect(isDesktop).toBe(true);

        const engine = platformAdapter.getEngine();
        expect(engine.isDesktop).toBe(true);
    });

    test('WebEngine.openExternalUrl opens window with noopener,noreferrer', async () => {
        const mockOpen = jest.fn();
        // @ts-ignore
        global.window = {
            open: mockOpen,
            navigator: { platform: 'Win32' },
        } as any;

        const webEngine = new WebEngine();
        await webEngine.openExternalUrl('https://example.com');
        expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    });

    test('DesktopEngine.openExternalUrl falls back to window.open if tauri invoke is not available', async () => {
        const mockOpen = jest.fn();
        // @ts-ignore
        global.window = {
            open: mockOpen,
            navigator: { platform: 'Win32' },
        } as any;

        const desktopEngine = new DesktopEngine();
        await desktopEngine.openExternalUrl('https://example.com');
        expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    });
});
