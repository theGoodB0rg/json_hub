import type { Transport, TransportResult } from './types';

/**
 * XMLHttpRequest fallback.
 *
 * XHR predates the modern blocker era by a decade. Most blockers that
 * neutralize sendBeacon (and some that intercept fetch via Service Worker
 * tricks) do not touch XHR, since production apps still use it for file
 * uploads, long polling, etc. This gives us a second, structurally different
 * delivery path for the ~10–20% of users where fetch fails or is proxied.
 */
export const xhrAsyncTransport: Transport = {
    name: 'xhr-async',

    isAvailable(): boolean {
        return typeof XMLHttpRequest !== 'undefined';
    },

    send(endpoint: string, body: Uint8Array, contentType: string): Promise<TransportResult> {
        return new Promise((resolve) => {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', endpoint, true);
                xhr.setRequestHeader('Content-Type', contentType);
                xhr.withCredentials = false;
                // Fail fast — don't hold the browser connection waiting on a
                // stuck or rate-limited endpoint. Three seconds is well above
                // real p99 latency to the edge.
                xhr.timeout = 3000;
                xhr.onload = () => {
                    const ok = xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300);
                    resolve(ok ? { delivered: true } : { delivered: false, reason: `http_${xhr.status}` });
                };
                xhr.onerror = () => resolve({ delivered: false, reason: 'xhr_error' });
                xhr.ontimeout = () => resolve({ delivered: false, reason: 'xhr_timeout' });
                xhr.onabort = () => resolve({ delivered: false, reason: 'xhr_abort' });
                // Wrap in Blob — XHR.send() accepts BodyInit which excludes raw
                // Uint8Array under strict TS lib types. The `as BlobPart` cast
                // sidesteps TS's ArrayBuffer-vs-ArrayBufferLike pedantry; the
                // runtime value is always a browser-friendly byte view.
                xhr.send(new Blob([body as BlobPart], { type: contentType }));
            } catch (err) {
                const name = err instanceof Error ? err.name : 'unknown';
                resolve({ delivered: false, reason: `xhr_throw_${name}` });
            }
        });
    },
};
