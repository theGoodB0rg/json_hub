export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'html' | 'zip' | 'jsonl';

export type ArrayHandling = 'join' | 'expand' | 'stringify';

export interface PlatformConversionOptions {
    format: ExportFormat;
    delimiter?: string;
    keySeparator?: string;
    arrayHandling?: ArrayHandling;
    autoUnescape?: boolean;
    maxDepth?: number;
    sheetName?: string;
}

export interface PlatformProgressUpdate {
    processedRecords: number;
    processedBytes: number;
    totalBytes: number;
    percent: number;
}

export interface PlatformConversionSummary {
    totalRecords: number;
    totalColumns: number;
    totalBytesRead: number;
    elapsedMillis: number;
    outputPath?: string;
}

export interface DesktopEnvironmentInfo {
    isDesktop: boolean;
    os: string;
    rustEngineVersion: string;
    streamingSupported: boolean;
}

export interface IPlatformEngine {
    readonly isDesktop: boolean;
    
    getEnvironmentInfo(): Promise<DesktopEnvironmentInfo>;
    
    convertFileStreaming?(
        inputPath: string,
        outputPath: string,
        options: PlatformConversionOptions,
        onProgress?: (progress: PlatformProgressUpdate) => void
    ): Promise<PlatformConversionSummary>;

    batchConvert?(
        inputFiles: string[],
        outputDir: string,
        options: PlatformConversionOptions,
        onProgress?: (current: number, total: number) => void
    ): Promise<{ succeeded: number; failed: number; elapsedMillis: number }>;

    startFolderWatcher?(
        watcherId: string,
        watchDir: string,
        outputDir: string,
        options: PlatformConversionOptions,
        onEvent?: (sourceFile: string, outputFile: string) => void
    ): Promise<boolean>;

    stopFolderWatcher?(watcherId: string): Promise<boolean>;

    openExternalUrl?(url: string): Promise<void>;
}
