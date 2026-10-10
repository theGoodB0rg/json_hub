import type { Transport, TransportResult } from './types';

/**
 * fetch(..., { keepalive: true }) — the primary transport.
 *
 * Why primary (not navigator.sendBeacon):
 * uBlock Origin, Brave Shields, Privacy Badger, DuckDuckGo and Firefox ETP
 * all stub `navigator.sendBeacon` to return `true` without transmitting.
 * fetch is harder to spoof — a blocked fetch rejects or returns a non-ok
 * response, so we can detect and fall through to the next transport.
 *
 * `keepalive: true` keeps the request alive across page unload (up to 64KiB
 * per Fetch spec), matching the one real reason sendBeacon was ever used.
 */
export const fetchKeepaliveTransport: Transport = {
    name: 'fetch-keepalive',

    isAvailable(): boolean {
        return typeof fetch === 'function';
    },

    async send(endpoint: string, body: Uint8Array, contentType: string): Promise<TransportResult> {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': contentType },
                body: body as unknown as BodyInit,
                keepalive: true,
                credentials: 'omit',
                mode: 'cors',
                // No referrer: keeps the request shape plain and reduces fingerprinting surface.
                referrerPolicy: 'no-referrer',
            });
            if (res.ok || res.status === 202 || res.status === 204) {
                return { delivered: true };
            }
            return { delivered: false, reason: `http_${res.status}` };
        } catch (err) {
            // AbortError / network errors / blocker rejections all land here.
            const name = err instanceof Error ? err.name : 'unknown';
            return { delivered: false, reason: `fetch_${name}` };
        }
    },
};
