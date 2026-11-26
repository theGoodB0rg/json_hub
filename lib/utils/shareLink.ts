import LZString from 'lz-string';

const SHARE_PARAM = 'share';

/** Compressed length the in-app Share button allows (keeps links paste-friendly). */
const DEFAULT_MAX_COMPRESSED = 2048;

export interface ShareUrlOptions {
    /** Longest compressed payload allowed; longer data returns null. */
    maxCompressed?: number;
    /** Attribution tag sent as `?ref=` (e.g. `mcp`), visible to telemetry. */
    ref?: string;
}

/**
 * Builds a link that opens JsonExport with `json` preloaded. The data rides
 * in the URL fragment (`#share=`), which browsers never send to a server, so
 * the "your data never leaves your browser" promise holds for shared links.
 * Pure: safe to call from the web app, the desktop app or a worker.
 */
export function buildShareUrl(origin: string, json: string, options: ShareUrlOptions = {}): string | null {
    const compressed = LZString.compressToEncodedURIComponent(json);
    if (compressed.length > (options.maxCompressed ?? DEFAULT_MAX_COMPRESSED)) return null;
    const query = options.ref ? `?ref=${encodeURIComponent(options.ref)}` : '';
    return `${origin}/${query}#${SHARE_PARAM}=${compressed}`;
}

/**
 * Compresses JSON data and creates a shareable URL
 * @param jsonData - JSON string to share
 * @returns Shareable URL or null if data is too large
 */
export function createShareableLink(jsonData: string): string | null {
    try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return buildShareUrl(origin, jsonData);
    } catch (error) {
        console.error('Failed to create shareable link:', error);
        return null;
    }
}

/** Reads the share payload from `#share=` (current) or `?share=` (older links). */
export function readSharePayload(hash: string, search: string): string | null {
    const fromHash = new URLSearchParams(hash.replace(/^#/, '')).get(SHARE_PARAM);
    const encoded = fromHash ?? new URLSearchParams(search).get(SHARE_PARAM);
    if (!encoded) return null;
    return LZString.decompressFromEncodedURIComponent(encoded) || null;
}

/**
 * Extracts and decompresses JSON data from a shareable URL
 * @returns Decompressed JSON string or null if no share data
 */
export function loadFromShareableLink(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        const data = readSharePayload(window.location.hash, window.location.search);
        if (data) {
            // Drop the payload from the address bar so a refresh or a copied
            // URL does not carry the user's data around.
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        return data;
    } catch (error) {
        console.error('Failed to load from shareable link:', error);
        return null;
    }
}

/**
 * Copies text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves to true if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}
