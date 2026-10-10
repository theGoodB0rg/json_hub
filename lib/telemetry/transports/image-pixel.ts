import type { Transport, TransportResult } from './types';

/**
 * Image pixel GET — last-resort transport.
 *
 * When every JS network API is blocked, an <img> load still works because
 * the browser treats it as app functionality. Historically every analytics
 * platform used this; modern blockers have aged into targeting /collect-style
 * query params rather than image loads to opaque first-party paths.
 *
 * Trade-off: GET only, URL-length-limited (~2 KiB safe), no response body.
 * We encode the payload as a single base64url query parameter and treat an
 * image load (even if 1x1 transparent or 204) as success. For events larger
 * than ~1.5 KiB after base64, this transport should decline so the caller
 * doesn't truncate.
 */

const MAX_PIXEL_URL_BYTES = 2048;
const PIXEL_PARAM = 'd';

function base64url(bytes: Uint8Array): string {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const imagePixelTransport: Transport = {
    name: 'image-pixel',

    isAvailable(): boolean {
        return typeof Image === 'function';
    },

    send(endpoint: string, body: Uint8Array, _contentType: string): Promise<TransportResult> {
        return new Promise((resolve) => {
            try {
                const encoded = base64url(body);
                const sep = endpoint.includes('?') ? '&' : '?';
                const url = `${endpoint}${sep}${PIXEL_PARAM}=${encoded}`;

                if (url.length > MAX_PIXEL_URL_BYTES) {
                    resolve({ delivered: false, reason: 'pixel_payload_too_large' });
                    return;
                }

                const img = new Image();
                let done = false;
                const finish = (delivered: boolean, reason?: string) => {
                    if (done) return;
                    done = true;
                    resolve({ delivered, reason });
                };
                // A 1x1 image response or any 2xx/3xx counts as success.
                img.onload = () => finish(true);
                // Even an error may indicate the request reached the server
                // (which then returned 204 No Content). Blockers that cancel
                // the request fire onerror immediately with no network trip,
                // so we treat onerror as failure and let the next transport try.
                img.onerror = () => finish(false, 'img_error');
                // Timebox the attempt: slow loads could stall the fallback chain.
                setTimeout(() => finish(false, 'img_timeout'), 3000);
                img.src = url;
            } catch (err) {
                const name = err instanceof Error ? err.name : 'unknown';
                resolve({ delivered: false, reason: `pixel_throw_${name}` });
            }
        });
    },
};
