import { IPlatformEngine, DesktopEnvironmentInfo } from './types';

export class WebEngine implements IPlatformEngine {
    public readonly isDesktop = false;

    public async getEnvironmentInfo(): Promise<DesktopEnvironmentInfo> {
        return {
            isDesktop: false,
            os: typeof window !== 'undefined' ? window.navigator.platform : 'web',
            rustEngineVersion: 'n/a (browser v8)',
            streamingSupported: false,
        };
    }

    public async openExternalUrl(url: string): Promise<void> {
        if (typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }
}
