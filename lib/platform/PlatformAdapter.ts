import { IPlatformEngine } from './types';
import { WebEngine } from './WebEngine';
import { DesktopEngine } from './DesktopEngine';

class PlatformAdapter {
    private engineInstance: IPlatformEngine | null = null;

    public isDesktopEnvironment(): boolean {
        if (typeof window === 'undefined') return false;
        return Boolean((window as any).__TAURI_INTERNALS__);
    }

    public getEngine(): IPlatformEngine {
        if (!this.engineInstance) {
            if (this.isDesktopEnvironment()) {
                this.engineInstance = new DesktopEngine();
            } else {
                this.engineInstance = new WebEngine();
            }
        }
        return this.engineInstance;
    }
}

export const platformAdapter = new PlatformAdapter();
