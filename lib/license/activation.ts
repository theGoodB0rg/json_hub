/**
 * Client wrapper for the jsonexport-license Cloudflare Worker.
 *
 * Three operations:
 *   - activate(key) → POSTs to /activate with a per-device id, caches the
 *     returned JWT in localStorage, flips useProStore to Pro.
 *   - verify()      → POSTs the cached JWT to /verify so a quick server
 *     check confirms it's still valid (not revoked, not expired).
 *   - deactivate()  → removes this device from the license's active set
 *     and clears local state.
 *
 * The JWT is cached in localStorage. It is NOT a credential — users can
 * decode its payload but can't forge new ones without the Worker's HMAC
 * secret, so flipping it in DevTools gets rejected on verify.
 *
 * The device_id is a per-origin UUID generated once + persisted; it
 * identifies "this browser profile" so re-opening the tab doesn't eat a
 * license slot every time.
 */

import { useProStore } from '@/lib/store/proStore';

const LICENSE_ENDPOINT =
    process.env.NEXT_PUBLIC_LICENSE_URL ||
    'https://jsonexport-license.theregalstarlite.workers.dev';

const JWT_STORAGE_KEY = 'jsonexport:license-jwt';
const DEVICE_STORAGE_KEY = 'jsonexport:device-id';
const LICENSE_KEY_STORAGE_KEY = 'jsonexport:license-key';

function getDeviceId(): string {
    if (typeof window === 'undefined') return 'ssr';
    try {
        let id = window.localStorage.getItem(DEVICE_STORAGE_KEY);
        if (!id) {
            id = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            window.localStorage.setItem(DEVICE_STORAGE_KEY, id);
        }
        return id;
    } catch {
        return `fallback-${Date.now()}`;
    }
}

function cacheJwt(jwt: string | null, licenseKey: string | null) {
    if (typeof window === 'undefined') return;
    try {
        if (jwt && licenseKey) {
            window.localStorage.setItem(JWT_STORAGE_KEY, jwt);
            window.localStorage.setItem(LICENSE_KEY_STORAGE_KEY, licenseKey);
        } else {
            window.localStorage.removeItem(JWT_STORAGE_KEY);
            window.localStorage.removeItem(LICENSE_KEY_STORAGE_KEY);
        }
    } catch {
        // Private browsing / disk full — fine, the next activate() retries.
    }
}

function getCachedJwt(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(JWT_STORAGE_KEY);
    } catch {
        return null;
    }
}

function getCachedLicenseKey(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(LICENSE_KEY_STORAGE_KEY);
    } catch {
        return null;
    }
}

export interface ActivationResult {
    ok: boolean;
    error?: string;
    message?: string;
    devicesUsed?: number;
    devicesAllowed?: number;
    email?: string | null;
}

export async function activateLicense(licenseKey: string): Promise<ActivationResult> {
    const trimmed = licenseKey.trim();
    if (!trimmed) return { ok: false, error: 'empty_key', message: 'Enter your license key.' };

    try {
        const res = await fetch(`${LICENSE_ENDPOINT}/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: trimmed, device_id: getDeviceId() }),
        });
        const body = await res.json() as {
            ok?: boolean;
            jwt?: string;
            error?: string;
            message?: string;
            devices_used?: number;
            devices_allowed?: number;
            email?: string | null;
        };
        if (!body.ok || !body.jwt) {
            return {
                ok: false,
                error: body.error || `http_${res.status}`,
                message: body.message || 'License activation failed.',
            };
        }
        cacheJwt(body.jwt, trimmed);
        useProStore.getState().setIsPro(true);
        return {
            ok: true,
            devicesUsed: body.devices_used,
            devicesAllowed: body.devices_allowed,
            email: body.email,
        };
    } catch (err) {
        return {
            ok: false,
            error: 'network',
            message: err instanceof Error ? err.message : 'Network error. Try again.',
        };
    }
}

/**
 * Called on app boot (and periodically). Re-verifies the cached JWT with
 * the server. On success, flips useProStore to true. On expiry/revocation,
 * clears local state so the user gets prompted to re-activate.
 */
export async function verifyCachedLicense(): Promise<{ pro: boolean; reason?: string }> {
    const jwt = getCachedJwt();
    if (!jwt) return { pro: false, reason: 'no_jwt' };
    try {
        const res = await fetch(`${LICENSE_ENDPOINT}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jwt }),
        });
        const body = await res.json() as { ok?: boolean; pro?: boolean; error?: string };
        if (body.ok && body.pro) {
            useProStore.getState().setIsPro(true);
            return { pro: true };
        }
        // Expired or revoked — clear so the UI shows the re-activate prompt
        // instead of a stuck "Pro" state based on a stale JWT.
        cacheJwt(null, null);
        useProStore.getState().setIsPro(false);
        return { pro: false, reason: body.error || 'invalid' };
    } catch {
        // Network blip: don't clear the cache. The user keeps their Pro
        // features on offline / flaky connections for the 7-day JWT TTL.
        // Keep useProStore in whatever state it already was.
        return { pro: useProStore.getState().isPro, reason: 'offline' };
    }
}

export async function deactivateThisDevice(): Promise<{ ok: boolean }> {
    const key = getCachedLicenseKey();
    if (!key) {
        cacheJwt(null, null);
        useProStore.getState().setIsPro(false);
        return { ok: true };
    }
    try {
        await fetch(`${LICENSE_ENDPOINT}/deactivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: key, device_id: getDeviceId() }),
        });
    } catch {
        // Fire-and-forget on network error — local state still gets wiped.
    }
    cacheJwt(null, null);
    useProStore.getState().setIsPro(false);
    return { ok: true };
}

export function getStoredLicenseInfo(): { licenseKey: string | null; hasJwt: boolean } {
    return { licenseKey: getCachedLicenseKey(), hasJwt: !!getCachedJwt() };
}
