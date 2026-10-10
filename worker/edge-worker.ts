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

/**
 * How we came by the bot score in double2. Stored in double3 so every row
 * says what its own score means — the 2026-10-10 incident happened because
 * "1" silently meant two different things (verified bot / unscored human).
 */
export const SCORE_SOURCE = {
    UNSCORED: 0,
    CF_SCORED: 1,
    VERIFIED_BOT: 2,
} as const;

/**
 * Bumped whenever the meaning of a blob/double column changes. Rows written
 * before the bot-score fix carry no double4 at all (reads back as 0), which
 * is exactly how the capture-rate query excludes them from human counts.
 */
export const ROW_SCHEMA_VERSION = 2;

/** CF's recommended "likely human" threshold for a real bot score. */
export const HUMAN_BOT_SCORE_THRESHOLD = 30;

/**
 * The single definition of "this request looks like a real person".
 * The edge worker uses it to decide whether to write the D1 fallback row;
 * scripts/analytics/capture-rate.ts mirrors it in SQL. Keep the two in sync —
 * the SQL version is asserted against this function in the worker tests.
 */
export function looksHuman(botScore: number, scoreSource: number, uaClass: string): boolean {
    // A declared, verified bot is never a human, whatever its UA says.
    if (scoreSource === SCORE_SOURCE.VERIFIED_BOT) return false;
    // A real CF score is the most trustworthy signal we have.
    if (scoreSource === SCORE_SOURCE.CF_SCORED) return botScore >= HUMAN_BOT_SCORE_THRESHOLD;
    // Unscored: fall back to the UA class heuristic.
    return uaClass !== 'bot' && uaClass !== 'automated';
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
                //
                // IMPORTANT (2026-10-10 fix): the previous derivation was
                //     typeof cf.verifiedBotCategory === 'string' ? 1 : 0
                // On the free tier `cf.botManagement` is undefined AND
                // `cf.verifiedBotCategory` is present as an EMPTY STRING for
                // ordinary human traffic. `typeof '' === 'string'` is true, so
                // every single request — human or not — was stamped with
                // botScore = 1 ("definitely bot"). That silently zeroed both
                // Pillar 1 (the human-looking AE count) and the Pillar 2 edge
                // fallback writes, because both gates require score >= 30 or
                // score === 0. Verified in Analytics Engine: 357/357 rows over
                // 48h carried double2 = 1, including rows with uaClass
                // 'desktop' and 'mobile'.
                //
                // Correct semantics, encoded in double3 (scoreSource) so rows
                // are self-describing and old rows stay distinguishable:
                //   0 = UNSCORED    — CF gave us nothing; fall back to uaClass
                //   1 = CF_SCORED   — real cf.botManagement.score (1..99)
                //   2 = VERIFIED_BOT— cf.verifiedBotCategory is a NON-EMPTY
                //                     string, i.e. a declared good bot
                //                     (Googlebot, bingbot, ...)
                const cfScore = cf.botManagement?.score;
                const verifiedBotCategory = typeof cf.verifiedBotCategory === 'string'
                    ? cf.verifiedBotCategory.trim()
                    : '';

                let botScore: number;
                let scoreSource: number;
                if (typeof cfScore === 'number' && Number.isFinite(cfScore) && cfScore > 0) {
                    botScore = cfScore;
                    scoreSource = SCORE_SOURCE.CF_SCORED;
                } else if (verifiedBotCategory.length > 0) {
                    // A declared, verified bot. Score 1 is correct here.
                    botScore = 1;
                    scoreSource = SCORE_SOURCE.VERIFIED_BOT;
                } else {
                    // Unscored. 0 is the sentinel the capture-rate query
                    // treats as "let uaClass decide", NOT as "bot".
                    botScore = 0;
                    scoreSource = SCORE_SOURCE.UNSCORED;
                }

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
                        // blob6: the raw cf.verifiedBotCategory string.
                        //
                        // Recorded rather than inferred. The original bug came
                        // from assuming what this field contains for ordinary
                        // traffic; after the first fix, rows still came back
                        // classified VERIFIED_BOT with uaClass 'mobile' and
                        // 'other', which verified bots should not be. Storing
                        // the literal value is the only way to settle what
                        // Cloudflare actually sends on this plan instead of
                        // guessing a second time.
                        verifiedBotCategory.slice(0, 64),
                    ],
                    // doubles: numeric columns (up to 20, Float64)
                    doubles: [
                        1,             // double1: count (always 1 per row — SUM for pageviews)
                        botScore,      // double2: 0 = unscored, 1..99 = score
                        scoreSource,   // double3: see SCORE_SOURCE
                        ROW_SCHEMA_VERSION, // double4: bump when column meaning changes
                    ],
                    // indexes: single string index for sampling (up to 96 bytes)
                    // Use country for geo aggregations; keeps per-shard cardinality low.
                    indexes: [country],
                });

                // --- Pillar 2 fallback write ---
                // Also fire a page_view_edge event into D1 so we catch users
                // whose client-side beacon was blocked by uBlock / Brave /
                // iOS ITP / NoScript. The event_name is a sentinel: the
                // analytics report distinguishes 'page_view' (client beacon)
                // from 'page_view_edge' (server fallback) so we can compute
                // the blocker suppression rate honestly without double-
                // counting.
                //
                // Only fire for human-looking requests (bot score >= 30 or
                // score == 0 AND uaClass not bot/automated) — bot pageviews
                // would spam D1 and inflate the counter without informing
                // conversion metrics.
                const isHumanLike = looksHuman(botScore, scoreSource, uaClass);

                if (isHumanLike && env.TELEMETRY_UPSTREAM) {
                    const upstreamBase = env.TELEMETRY_UPSTREAM.replace(/\/$/, '');
                    const edgeEventBody = JSON.stringify({
                        event_name: 'page_view_edge',
                        path,
                        referrer,
                        // bot_score + ua_class are not in the schema; packed
                        // into error_type as a tiny breadcrumb so the row is
                        // still introspectable later. is_sample flags obvious
                        // bots we let through (score < 30 but ambiguous UA)
                        // so they don't pollute conversion funnels.
                        error_type: `edge:bot_score=${botScore};src=${scoreSource};ua=${uaClass}`,
                        is_sample: scoreSource === SCORE_SOURCE.CF_SCORED && botScore < 30 ? 1 : 0,
                    });
                    // waitUntil keeps the write alive past the response
                    // without blocking the user. Catch silently — telemetry
                    // failures must never surface to the visitor.
                    ctx.waitUntil(
                        fetch(`${upstreamBase}/api/telemetry`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'cf-ipcountry': country,
                                'user-agent': request.headers.get('user-agent') || '',
                                // Mark the request so the upstream can
                                // distinguish genuine client beacons from
                                // our server-side fallback if we ever add
                                // divergent handling later.
                                'x-source': 'edge-worker',
                            },
                            body: edgeEventBody,
                        }).catch(() => {})
                    );
                }
            } catch {
                // Never block the response on telemetry.
            }
        }

        // Pass-through to origin. The orange-cloud proxy means CF already
        // fetches from the GitHub Pages origin (A records); we just forward.
        return fetch(request);
    },
};
