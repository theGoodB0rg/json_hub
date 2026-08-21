import {
    IPlatformEngine,
    DesktopEnvironmentInfo,
    PlatformConversionOptions,
    PlatformConversionSummary,
    PlatformProgressUpdate,
} from './types';

export class DesktopEngine implements IPlatformEngine {
    public readonly isDesktop = true;

    private async getInvoke() {
        if (typeof window === 'undefined') {
            throw new Error('DesktopEngine can only run in a desktop window environment');
        }
        // @ts-ignore
        if (window.__TAURI_INTERNALS__) {
            const { invoke } = await import('@tauri-apps/api/core');
            return invoke;
        }
        throw new Error('Tauri runtime not detected');
    }

    private async getListen() {
        const { listen } = await import('@tauri-apps/api/event');
        return listen;
    }

    public async getEnvironmentInfo(): Promise<DesktopEnvironmentInfo> {
        try {
            const invoke = await this.getInvoke();
            return await invoke<DesktopEnvironmentInfo>('get_desktop_info');
        } catch (e) {
            return {
                isDesktop: true,
                os: 'desktop',
                rustEngineVersion: '0.1.0',
                streamingSupported: true,
            };
        }
    }

    public async convertFileStreaming(
        inputPath: string,
        outputPath: string,
        options: PlatformConversionOptions,
        onProgress?: (progress: PlatformProgressUpdate) => void
    ): Promise<PlatformConversionSummary> {
        const invoke = await this.getInvoke();
        let unlisten: (() => void) | undefined;

        if (onProgress) {
            const listen = await this.getListen();
            unlisten = await listen<PlatformProgressUpdate>('conversion_progress', (event) => {
                onProgress(event.payload);
            });
        }

        try {
            const rustOptions = {
                format: options.format,
                delimiter: options.delimiter ? options.delimiter.charAt(0) : ',',
                key_separator: options.keySeparator || '.',
                array_handling: options.arrayHandling || 'join',
                auto_unescape: options.autoUnescape ?? true,
                max_depth: options.maxDepth || 10,
                include_headers: true,
                excel_sheet_name: options.sheetName || 'Export',
            };

            const summary = await invoke<PlatformConversionSummary>('convert_file_streaming', {
                inputPath,
                outputPath,
                options: rustOptions,
            });

            return {
                ...summary,
                outputPath,
            };
        } finally {
            if (unlisten) {
                unlisten();
            }
        }
    }

    public async batchConvert(
        inputFiles: string[],
        outputDir: string,
        options: PlatformConversionOptions,
        onProgress?: (current: number, total: number) => void
    ): Promise<{ succeeded: number; failed: number; elapsedMillis: number }> {
        const invoke = await this.getInvoke();
        let unlisten: (() => void) | undefined;

        if (onProgress) {
            const listen = await this.getListen();
            unlisten = await listen<{ current: number; total: number }>('batch_progress', (event: any) => {
                onProgress(event.payload.current, event.payload.total);
            });
        }

        try {
            const rustOptions = {
                format: options.format,
                delimiter: options.delimiter ? options.delimiter.charAt(0) : ',',
                key_separator: options.keySeparator || '.',
                array_handling: options.arrayHandling || 'join',
                auto_unescape: options.autoUnescape ?? true,
                max_depth: options.maxDepth || 10,
                include_headers: true,
                excel_sheet_name: options.sheetName || 'Export',
            };

            const res = await invoke<any>('batch_convert_files', {
                inputFiles,
                outputDir,
                options: rustOptions,
            });

            return {
                succeeded: res.succeeded,
                failed: res.failed,
                elapsedMillis: res.elapsed_millis,
            };
        } finally {
            if (unlisten) {
                unlisten();
            }
        }
    }

    public async startFolderWatcher(
        watcherId: string,
        watchDir: string,
        outputDir: string,
        options: PlatformConversionOptions,
        onEvent?: (sourceFile: string, outputFile: string) => void
    ): Promise<boolean> {
        const invoke = await this.getInvoke();
        if (onEvent) {
            const listen = await this.getListen();
            await listen<any>('folder_watcher_event', (event: any) => {
                if (event.payload.watcher_id === watcherId) {
                    onEvent(event.payload.source_file, event.payload.output_file);
                }
            });
        }

        const rustOptions = {
            format: options.format,
            delimiter: options.delimiter ? options.delimiter.charAt(0) : ',',
            key_separator: options.keySeparator || '.',
            array_handling: options.arrayHandling || 'join',
            auto_unescape: options.autoUnescape ?? true,
            max_depth: options.maxDepth || 10,
            include_headers: true,
            excel_sheet_name: options.sheetName || 'Export',
        };

        return await invoke<boolean>('start_folder_watcher', {
            watcherId,
            watchDir,
            outputDir,
            options: rustOptions,
        });
    }

    public async stopFolderWatcher(watcherId: string): Promise<boolean> {
        const invoke = await this.getInvoke();
        return await invoke<boolean>('stop_folder_watcher', { watcherId });
    }

    public async openExternalUrl(url: string): Promise<void> {
        try {
            const invoke = await this.getInvoke();
            await invoke<boolean>('open_external_url', { url });
        } catch {
            if (typeof window !== 'undefined') {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
    }
}
