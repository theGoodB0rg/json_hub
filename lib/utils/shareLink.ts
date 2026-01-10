import LZString from 'lz-string';

/**
 * Compresses JSON data and creates a shareable URL
 * @param jsonData - JSON string to share
 * @returns Shareable URL or null if data is too large
 */
export function createShareableLink(jsonData: string): string | null {
    try {
        // Compress the JSON data
        const compressed = LZString.compressToEncodedURIComponent(jsonData);

        // Check if compressed data is too large for URL (max ~2KB for safety)
        if (compressed.length > 2048) {
            return null;
        }

        // Create the shareable URL
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/?share=${compressed}`;
    } catch (error) {
        console.error('Failed to create shareable link:', error);
        return null;
    }
}

/**
 * Extracts and decompresses JSON data from a shareable URL
 * @returns Decompressed JSON string or null if no share data
 */
export function loadFromShareableLink(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const shareData = urlParams.get('share');

        if (!shareData) return null;

        // Decompress the data
        const decompressed = LZString.decompressFromEncodedURIComponent(shareData);

        if (!decompressed) {
            console.error('Failed to decompress share data');
            return null;
        }

        return decompressed;
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
