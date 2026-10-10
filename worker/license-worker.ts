/**
 * jsonexport-license — license activation + verification worker.
 *
 * Shipped in M3 of MONETIZATION_ROADMAP_2026-10-10.md to replace the
 * trivially-bypassable client-side `useProStore.setIsPro(true)` with
 * a proper server-mediated activation flow.
 *
 * Flow:
 *   1. Client POSTs { license_key, device_id } to /l/activate
 *   2. Worker calls Gumroad's /v2/licenses/verify (increments uses)
 *   3. Worker checks activation count against MAX_USES (3 by default)
 *   4. Worker records { license_key, device_id } in D1 table `license_activations`
 *   5. Worker signs + returns a short-lived (7-day) JWT the client caches
 *   6. On every protected feature, client posts the JWT to /l/verify;
 *      worker validates signature + checks D1 for revocation
 *
 * Why this isn't just "localStorage with extra steps":
 *   - A JWT is a VERIFIED ARTIFACT, not a credential. Users can read the
 *     payload but can't forge a new one without the signing secret.
 *   - Max-uses enforcement at the server side defeats "share the key"
 *     — the 4th device trying the same key gets rejected.
 *   - Server-side revocation table means a refunded buyer loses access
 *     within one re-verify (typically ~7 days or on next launch).
 *
 * Security notes:
 *   - LICENSE_SIGNING_SECRET is a 32+ byte random string, stored as a CF
 *     Worker secret. Never commit it. HMAC-SHA256 of header+payload.
 *   - The JWT exp field is honored both server-side (re-verify rejects
 *     expired) and client-side (bias toward re-verifying before expiry).
 *   - CORS is permissive (Origin: *) because the Pro status check must
 *     work from the static-exported Pages site served off CF edge.
 */

export interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    run(): Promise<unknown>;
    first<T = unknown>(): Promise<T | null>;
    all<T = unknown>(): Promise<{ results: T[] }>;
}

export interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
}

export interface Env {
    DB: D1Database;
    LICENSE_SIGNING_SECRET: string;
    GUMROAD_PRODUCT_PERMALINK: string; // "json_hub" — the Gumroad short-link
    MAX_USES_PER_LICENSE?: string; // "3" default; keep as string from env
}

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

const JWT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const DEFAULT_MAX_USES = 3;

function jsonResponse(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
    });
}

// --- HMAC-SHA256 JWT (minimal; avoids pulling in jose) --------------------

async function hmac(secret: string, data: string): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return new Uint8Array(sig);
}

function b64url(bytes: Uint8Array | string): string {
    const bin = typeof bytes === 'string'
        ? bytes
        : Array.from(bytes).map((b) => String.fromCharCode(b)).join('');
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    return atob(b64 + pad);
}

async function signJwt(secret: string, payload: Record<string, unknown>): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const h = b64url(JSON.stringify(header));
    const p = b64url(JSON.stringify(payload));
    const data = `${h}.${p}`;
    const sig = await hmac(secret, data);
    return `${data}.${b64url(sig)}`;
}

async function verifyJwt(secret: string, token: string): Promise<Record<string, unknown> | null> {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const data = `${h}.${p}`;
    const expected = b64url(await hmac(secret, data));
    // Constant-time comparison on strings — short, so this is fine for our scale.
    if (expected.length !== s.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ s.charCodeAt(i);
    if (diff !== 0) return null;
    try {
        const payload = JSON.parse(b64urlDecode(p)) as Record<string, unknown>;
        if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
            return null; // expired
        }
        return payload;
    } catch {
        return null;
    }
}

// --- Gumroad license verification ----------------------------------------

interface GumroadVerifyResponse {
    success: boolean;
    uses?: number;
    purchase?: {
        email?: string;
        sale_id?: string;
        refunded?: boolean;
        disputed?: boolean;
        chargebacked?: boolean;
        license_disabled?: boolean;
    };
    message?: string;
}

async function verifyWithGumroad(permalink: string, licenseKey: string, incrementUses: boolean): Promise<GumroadVerifyResponse> {
    const body = new URLSearchParams({
        product_permalink: permalink,
        license_key: licenseKey,
        increment_uses_count: String(incrementUses),
    });
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    if (!res.ok) {
        return { success: false, message: `Gumroad HTTP ${res.status}` };
    }
    return res.json<GumroadVerifyResponse>();
}

// --- Handlers --------------------------------------------------------------

async function handleActivate(req: Request, env: Env): Promise<Response> {
    const body = await req.json<{ license_key?: string; device_id?: string }>().catch(() => ({}));
    const licenseKey = typeof body.license_key === 'string' ? body.license_key.trim() : '';
    const deviceId = typeof body.device_id === 'string' ? body.device_id.trim().slice(0, 128) : '';
    if (!licenseKey || !deviceId) {
        return jsonResponse({ ok: false, error: 'license_key and device_id required' }, 400);
    }

    const maxUses = Number(env.MAX_USES_PER_LICENSE || DEFAULT_MAX_USES);

    // Check if this device already has an active activation — idempotent.
    const existing = await env.DB.prepare(
        'SELECT device_id FROM license_activations WHERE license_key = ? AND device_id = ? AND revoked_at IS NULL LIMIT 1'
    ).bind(licenseKey, deviceId).first<{ device_id: string }>();
    const isReactivation = !!existing;

    // Count active activations for this license (excluding this device if re-activating).
    const activeCount = await env.DB.prepare(
        'SELECT COUNT(*) AS n FROM license_activations WHERE license_key = ? AND device_id != ? AND revoked_at IS NULL'
    ).bind(licenseKey, deviceId).first<{ n: number }>();
    const otherDeviceCount = Number(activeCount?.n || 0);

    if (!isReactivation && otherDeviceCount >= maxUses) {
        return jsonResponse({
            ok: false,
            error: 'max_uses_exceeded',
            message: `This license is already active on ${otherDeviceCount} device(s). Max allowed: ${maxUses}. Deactivate another device first.`,
        }, 403);
    }

    // Verify with Gumroad. Only increment uses count on a NEW activation —
    // re-opening the app on an already-activated device shouldn't eat a slot.
    const gumroad = await verifyWithGumroad(env.GUMROAD_PRODUCT_PERMALINK, licenseKey, !isReactivation);
    if (!gumroad.success) {
        return jsonResponse({ ok: false, error: 'invalid_license', message: gumroad.message || 'License not recognized by Gumroad' }, 403);
    }
    if (gumroad.purchase?.refunded || gumroad.purchase?.chargebacked || gumroad.purchase?.license_disabled) {
        return jsonResponse({ ok: false, error: 'license_revoked', message: 'This license has been refunded or disabled.' }, 403);
    }

    // Record (or re-affirm) the activation. INSERT OR REPLACE on composite
    // key prevents duplicate rows for the same license+device pair.
    const country = (req as unknown as { cf?: { country?: string } }).cf?.country || 'XX';
    const userAgent = req.headers.get('user-agent')?.slice(0, 300) || '';
    await env.DB.prepare(
        `INSERT OR REPLACE INTO license_activations
            (license_key, device_id, activated_at, country, user_agent, email)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(licenseKey, deviceId, Date.now(), country, userAgent, gumroad.purchase?.email || null).run();

    // Issue JWT
    const now = Math.floor(Date.now() / 1000);
    const token = await signJwt(env.LICENSE_SIGNING_SECRET, {
        iss: 'jsonexport',
        sub: licenseKey,
        did: deviceId,
        iat: now,
        exp: now + JWT_TTL_SECONDS,
        pro: true,
    });

    return jsonResponse({
        ok: true,
        jwt: token,
        exp: now + JWT_TTL_SECONDS,
        devices_used: otherDeviceCount + (isReactivation ? 0 : 1),
        devices_allowed: maxUses,
        email: gumroad.purchase?.email || null,
    });
}

async function handleVerify(req: Request, env: Env): Promise<Response> {
    const body = await req.json<{ jwt?: string }>().catch(() => ({}));
    const token = typeof body.jwt === 'string' ? body.jwt : '';
    if (!token) return jsonResponse({ ok: false, error: 'jwt required' }, 400);

    const payload = await verifyJwt(env.LICENSE_SIGNING_SECRET, token);
    if (!payload) return jsonResponse({ ok: false, error: 'invalid_or_expired' }, 401);

    const licenseKey = String(payload.sub || '');
    const deviceId = String(payload.did || '');
    if (!licenseKey || !deviceId) return jsonResponse({ ok: false, error: 'malformed_jwt' }, 401);

    // Double-check against DB — the activation may have been revoked since
    // the JWT was issued. This is the whole point of server-side validation.
    const row = await env.DB.prepare(
        'SELECT revoked_at FROM license_activations WHERE license_key = ? AND device_id = ? LIMIT 1'
    ).bind(licenseKey, deviceId).first<{ revoked_at: number | null }>();
    if (!row) return jsonResponse({ ok: false, error: 'not_activated_on_this_device' }, 403);
    if (row.revoked_at) return jsonResponse({ ok: false, error: 'activation_revoked' }, 403);

    return jsonResponse({ ok: true, pro: true, exp: payload.exp });
}

async function handleDeactivate(req: Request, env: Env): Promise<Response> {
    const body = await req.json<{ license_key?: string; device_id?: string }>().catch(() => ({}));
    const licenseKey = typeof body.license_key === 'string' ? body.license_key.trim() : '';
    const deviceId = typeof body.device_id === 'string' ? body.device_id.trim() : '';
    if (!licenseKey || !deviceId) {
        return jsonResponse({ ok: false, error: 'license_key and device_id required' }, 400);
    }
    await env.DB.prepare(
        'UPDATE license_activations SET revoked_at = ? WHERE license_key = ? AND device_id = ?'
    ).bind(Date.now(), licenseKey, deviceId).run();
    return jsonResponse({ ok: true });
}

// --- Entry ----------------------------------------------------------------

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
        const url = new URL(request.url);
        if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'POST only' }, 405);

        try {
            if (url.pathname.endsWith('/activate')) return await handleActivate(request, env);
            if (url.pathname.endsWith('/verify')) return await handleVerify(request, env);
            if (url.pathname.endsWith('/deactivate')) return await handleDeactivate(request, env);
            return jsonResponse({ ok: false, error: 'not_found' }, 404);
        } catch (err) {
            // Never leak internals; log for ops.
            console.error('license-worker error:', err);
            return jsonResponse({ ok: false, error: 'internal' }, 500);
        }
    },
};
