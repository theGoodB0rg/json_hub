/**
 * jsonexport-edge: edge pageview middleware
 *
 * Sits on jsonexport.com/* as a Cloudflare Worker route. For each HTML
 * request, writes a single row to Workers Analytics Engine (server-side,
 * so no beacon, no JS, no ad-blocker exposure), then passes the request
 * through to the GitHub Pages origin unchanged.
 *
 * The Analytics Engine dataset accumulates (path, country, referrer, UA,
 * bot score) rows that we query via SQL API from the unified analytics
 * report. This is Pillar 1 of the blocker-resistant telemetry stack.
 */

export interface AnalyticsEngineDataPoint {
    blobs?: (string | null)[];
    doubles?: number[];
    indexes?: string[];
}

export interface AnalyticsEngineDataset {
    writeDataPoint(point: AnalyticsEngineDataPoint): void;
}

export interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
}

export interface Env {
    PAGEVIEWS: AnalyticsEngineDataset;
    /** Legacy telemetry worker URL for first-party proxy forwarding. */
    TELEMETRY_UPSTREAM?: string;
    /** Build-time path token — rotates per deploy so adblock rules can't match a stable pattern. */
    TELEMETRY_TOKEN?: string;
}

// Treat as "real HTML pageview" only when the request looks like a
// browser navigation to a page (not an asset fetch and not an API call).
function isHtmlPageRequest(request: Request, url: URL): boolean {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;

    // Static asset extensions — never a pageview
    const assetExtensions = /\.(css|js|mjs|json|xml|txt|svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|eot|map|pdf|zip|wasm)$/i;
    if (assetExtensions.test(url.pathname)) return false;

    // Next.js build artifacts
    if (url.pathname.startsWith('/_next/')) return false;
    if (url.pathname.startsWith('/static/')) return false;

    // Common machine endpoints
    if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml' || url.pathname === '/favicon.ico') return false;

    // The request must look like a browser asking for a page: an Accept header
    // that lists text/html is the strongest hint. Fall back to no-extension paths.
    const accept = request.headers.get('accept') || '';
    if (accept.includes('text/html')) return true;

    // No extension + GET + no Accept header → still probably a page (curl, etc.)
    const lastSegment = url.pathname.split('/').pop() || '';
    return !lastSegment.includes('.');
}

// Normalize path for aggregation — collapse trailing slashes, keep
// path only (no query string, no hash). Clamp length defensively.
function normalizePath(url: URL): string {
    let p = url.pathname || '/';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p.slice(0, 256) || '/';
}

// Short-form referrer: domain only to keep cardinality manageable.
// Full referrer path leaks query strings and inflates index cardinality.
function normalizeReferrer(ref: string | null): string {
    if (!ref) return '(direct)';
    try {
        const u = new URL(ref);
        return u.hostname.slice(0, 128) || '(direct)';
    } catch {
        return '(invalid)';
    }
}

// User-agent class, not full UA — keeps rows small and aggregatable.
function classifyUserAgent(ua: string | null): string {
    if (!ua) return 'unknown';
    const s = ua.slice(0, 500);
    if (/bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent/i.test(s)) return 'bot';
    if (/HeadlessChrome|puppeteer|playwright|selenium/i.test(s)) return 'automated';
    if (/Mobile|Android.*Mobile|iPhone|iPad/i.test(s)) return 'mobile';
    if (/Windows|Macintosh|Linux x86|CrOS/i.test(s)) return 'desktop';
    return 'other';
}

// First-party telemetry ingest paths. The build-time token in the middle
// segment rotates on every deploy — adblock rules targeting a stable
// `/collect` or `/telemetry` substring can't match. The three sub-paths
// are intentionally opaque (i = ingest one, b = ingest batch, f = feedback,
// p = pixel GET fallback).
function matchTelemetryPath(path: string, token: string): { kind: 'ingest' | 'batch' | 'feedback' | 'pixel' } | null {
    const prefix = `/_i/${token}/`;
    if (!path.startsWith(prefix)) return null;
    const op = path.slice(prefix.length);
    if (op === 'i') return { kind: 'ingest' };
    if (op === 'b') return { kind: 'batch' };
    if (op === 'f') return { kind: 'feedback' };
    if (op === 'p') return { kind: 'pixel' };
    return null;
}

// Translate opaque first-party ops to the upstream D1 worker's existing routes.
const OP_TO_UPSTREAM: Record<'ingest' | 'batch' | 'feedback' | 'pixel', string> = {
    ingest: '/api/telemetry',
    batch: '/api/telemetry/batch',
    feedback: '/api/feedback',
    // Pixel requests arrive as GET with payload in `?d=<base64>`; the
    // upstream handler accepts them at the batch endpoint — we rewrite
    // method and body in the proxy below.
    pixel: '/api/telemetry',
};

// For the pixel transport (GET with ?d=base64), decode and POST upstream.
async function handlePixelProxy(request: Request, upstreamBase: string): Promise<Response> {
    const url = new URL(request.url);
    const encoded = url.searchParams.get('d') || '';
    if (!encoded) return new Response('', { status: 204 });
    // base64url → bytes
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    let bytes: Uint8Array;
    try {
        const bin = atob(b64 + pad);
        bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch {
        return new Response('', { status: 204 });
    }
    // Forward as a POST to the upstream ingest endpoint, preserving
    // client IP/geo via the original request's cf headers.
    const upstreamReq = new Request(`${upstreamBase}/api/telemetry`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'cf-ipcountry': request.headers.get('cf-ipcountry') || '',
            'user-agent': request.headers.get('user-agent') || '',
        },
        body: bytes,
    });
    await fetch(upstreamReq).catch(() => {});
    // Return a 1x1 transparent GIF so the <img> load succeeds and the
    // transport reports delivered=true.
    const gif = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);
    return new Response(gif, {
        status: 200,
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // Never let telemetry failures affect the user response.
        ctx.passThroughOnException();

        const url = new URL(request.url);

        // Intercept first-party telemetry paths (Pillar 2 same-origin ingest).
        // These exist so client POSTs look like app internals, not tracking.
        const token = env.TELEMETRY_TOKEN || 'i';
        const telemetry = matchTelemetryPath(url.pathname, token);
        if (telemetry) {
            const upstreamBase = (env.TELEMETRY_UPSTREAM || 'https://jsonexport-telemetry.idowue93.workers.dev').replace(/\/$/, '');
            if (telemetry.kind === 'pixel') {
                return handlePixelProxy(request, upstreamBase);
            }
            const upstreamPath = OP_TO_UPSTREAM[telemetry.kind];
            const upstreamUrl = `${upstreamBase}${upstreamPath}`;
            const headers = new Headers(request.headers);
            // Strip CF-internal headers that confuse upstream origin detection.
            headers.delete('host');
            headers.delete('cf-connecting-ip');
            headers.delete('cf-visitor');
            try {
                const upstreamResp = await fetch(upstreamUrl, {
                    method: request.method,
                    headers,
                    body: request.body,
                    // CF Workers reject duplex: 'half' body streaming without this flag.
                });
                // Mirror the upstream response, but normalize cache headers so
                // CF edge never caches a 202 ingest ack.
                const respHeaders = new Headers(upstreamResp.headers);
                respHeaders.set('Cache-Control', 'no-store, max-age=0');
                respHeaders.set('Access-Control-Allow-Origin', '*');
                return new Response(upstreamResp.body, {
                    status: upstreamResp.status,
                    headers: respHeaders,
                });
            } catch {
                // Soft-fail — client orchestrator will try next endpoint in chain.
                return new Response(JSON.stringify({ ok: false }), {
                    status: 502,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
        }

        // CORS preflight for /_i/* — handle before the HTML pageview branch.
        if (request.method === 'OPTIONS' && url.pathname.startsWith('/_i/')) {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        if (isHtmlPageRequest(request, url)) {
            try {
                const cf = (request as any).cf || {};
                const path = normalizePath(url);
                const country = (cf.country as string) || request.headers.get('cf-ipcountry') || 'XX';
                const referrer = normalizeReferrer(request.headers.get('referer'));
                const uaClass = classifyUserAgent(request.headers.get('user-agent'));

                // Cloudflare bot score: 1 = definitely bot, 99 = definitely human.
                // Available on Enterprise and (as of 2024) a sampled version on Free.
                // When absent (free tier may return undefined), store 0.
                const botScore = typeof cf.botManagement?.score === 'number'
                    ? cf.botManagement.score
                    : (typeof cf.verifiedBotCategory === 'string' ? 1 : 0);

                // Writes are async; Analytics Engine batches on the edge.
                // writeDataPoint is synchronous but delivery is deferred.
                env.PAGEVIEWS.writeDataPoint({
                    // blobs: searchable string columns (up to 20, each up to 5120 bytes)
                    blobs: [
                        path,          // blob1
                        country,       // blob2
                        referrer,      // blob3
                        uaClass,       // blob4
                        request.headers.get('accept-language')?.slice(0, 64) || '', // blob5
                    ],
                    // doubles: numeric columns (up to 20, Float64)
                    doubles: [
                        1,             // double1: count (always 1 per row — SUM for pageviews)
                        botScore,      // double2: 1..99
                    ],
                    // indexes: single string index for sampling (up to 96 bytes)
                    // Use country for geo aggregations; keeps per-shard cardinality low.
                    indexes: [country],
                });
            } catch {
                // Never block the response on telemetry.
            }
        }

        // Pass-through to origin. The orange-cloud proxy means CF already
        // fetches from the GitHub Pages origin (A records); we just forward.
        return fetch(request);
    },
};
