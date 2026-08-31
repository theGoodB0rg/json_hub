export interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    run(): Promise<any>;
    all(): Promise<{ results: any[] }>;
}

export interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch(statements: D1PreparedStatement[]): Promise<any[]>;
}

export interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
}

export interface Env {
    DB: D1Database;
    ADMIN_SECRET?: string;
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
        },
    });
}

function safeString(val: any, maxLength = 256): string | null {
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, maxLength);
}

function safeNumber(val: any, min = 0, max = 1_000_000_000): number | null {
    if (typeof val !== 'number' || isNaN(val)) return null;
    return Math.max(min, Math.min(max, Math.round(val)));
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);

        try {
            // POST /api/telemetry or /api/telemetry/batch - Record event(s)
            if (
                request.method === 'POST' &&
                (url.pathname === '/api/telemetry' || url.pathname === '/api/telemetry/batch')
            ) {
                const body: any = await request.json();
                const rawEvents = Array.isArray(body) ? body : Array.isArray(body?.events) ? body.events : [body];
                const country = safeString((request as any).cf?.country || request.headers.get('cf-ipcountry'), 16) || 'Unknown';
                const userAgent = safeString(request.headers.get('user-agent'), 256) || 'Unknown';
                const timestamp = Date.now();

                // Cap batch at 100 events max to prevent DOS
                const eventsList = rawEvents.slice(0, 100);
                const statements: D1PreparedStatement[] = eventsList.map((e: any) => {
                    const id = safeString(e.id, 64) || crypto.randomUUID();
                    const eventTime = safeNumber(e.timestamp, 0, timestamp + 86400000) || timestamp;
                    return env.DB.prepare(
                        `INSERT INTO events (
                            id, event_name, platform, format, file_size_bytes, 
                            duration_ms, error_type, error_message, country, 
                            referrer, path, user_agent, timestamp
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                    ).bind(
                        id,
                        safeString(e.event_name, 64) || 'unknown',
                        safeString(e.platform, 64),
                        safeString(e.format, 32),
                        safeNumber(e.file_size_bytes),
                        safeNumber(e.duration_ms, 0, 3_600_000),
                        safeString(e.error_type, 64),
                        safeString(e.error_message, 500),
                        country,
                        safeString(e.referrer, 300),
                        safeString(e.path, 300),
                        userAgent,
                        eventTime
                    );
                });

                if (statements.length > 0) {
                    ctx.waitUntil(
                        env.DB.batch(statements).catch((err: any) =>
                            console.error('D1 batch insert error:', err)
                        )
                    );
                }

                return jsonResponse({ success: true, count: statements.length }, 202);
            }

            // POST /api/feedback - Record user output feedback
            if (request.method === 'POST' && url.pathname === '/api/feedback') {
                const body: any = await request.json();
                const id = safeString(body.id, 64) || crypto.randomUUID();
                const rating = body.rating === 'positive' || body.rating === 'negative' ? body.rating : 'neutral';
                const timestamp = Date.now();

                ctx.waitUntil(
                    env.DB.prepare(
                        `INSERT INTO user_feedback (
                            id, rating, comment, platform, format, path, timestamp
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
                    )
                        .bind(
                            id,
                            rating,
                            safeString(body.comment, 1000),
                            safeString(body.platform, 64),
                            safeString(body.format, 32),
                            safeString(body.path, 300),
                            timestamp
                        )
                        .run()
                        .catch((err: any) => console.error('D1 feedback insert error:', err))
                );

                return jsonResponse({ success: true, id }, 202);
            }

            // GET /api/telemetry/pull - Export events for local CLI
            if (request.method === 'GET' && url.pathname === '/api/telemetry/pull') {
                const authHeader = request.headers.get('Authorization');
                if (env.ADMIN_SECRET && authHeader !== `Bearer ${env.ADMIN_SECRET}`) {
                    return jsonResponse({ error: 'Unauthorized' }, 401);
                }

                const limit = Math.min(Number(url.searchParams.get('limit') || 2000), 10000);
                const since = Number(url.searchParams.get('since') || 0);

                const eventsQuery = env.DB.prepare(
                    'SELECT * FROM events WHERE timestamp > ? ORDER BY timestamp ASC LIMIT ?'
                ).bind(since, limit);

                const feedbackQuery = env.DB.prepare(
                    'SELECT * FROM user_feedback WHERE timestamp > ? ORDER BY timestamp ASC LIMIT ?'
                ).bind(since, limit);

                const [eventsResult, feedbackResult] = await Promise.all([
                    eventsQuery.all(),
                    feedbackQuery.all(),
                ]);

                return jsonResponse({
                    events: eventsResult.results,
                    feedback: feedbackResult.results,
                    count: {
                        events: eventsResult.results.length,
                        feedback: feedbackResult.results.length,
                    },
                    fetched_at: Date.now(),
                });
            }

            // Health check
            if (url.pathname === '/health' || url.pathname === '/') {
                return jsonResponse({ status: 'ok', service: 'jsonexport-telemetry' });
            }

            return jsonResponse({ error: 'Not found' }, 404);
        } catch (error: any) {
            return jsonResponse({ error: error.message || 'Internal server error' }, 500);
        }
    },
};
