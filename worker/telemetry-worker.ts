export interface D1Database {
    prepare(query: string): {
        bind(...values: any[]): {
            run(): Promise<any>;
            all(): Promise<{ results: any[] }>;
        };
    };
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

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);

        try {
            // POST /api/telemetry - Record event
            if (request.method === 'POST' && url.pathname === '/api/telemetry') {
                const body: any = await request.json();
                const id = crypto.randomUUID();
                const country = (request as any).cf?.country || request.headers.get('cf-ipcountry') || 'Unknown';
                const userAgent = request.headers.get('user-agent') || 'Unknown';
                const timestamp = Date.now();

                ctx.waitUntil(
                    env.DB.prepare(
                        `INSERT INTO events (
                            id, event_name, platform, format, file_size_bytes, 
                            duration_ms, error_type, error_message, country, 
                            referrer, path, user_agent, timestamp
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                    )
                        .bind(
                            id,
                            body.event_name || 'unknown',
                            body.platform || null,
                            body.format || null,
                            body.file_size_bytes || null,
                            body.duration_ms || null,
                            body.error_type || null,
                            body.error_message || null,
                            country,
                            body.referrer || null,
                            body.path || null,
                            userAgent,
                            timestamp
                        )
                        .run()
                        .catch((err: any) => console.error('D1 event insert error:', err))
                );

                return jsonResponse({ success: true, id }, 202);
            }

            // POST /api/feedback - Record user output feedback
            if (request.method === 'POST' && url.pathname === '/api/feedback') {
                const body: any = await request.json();
                const id = crypto.randomUUID();
                const timestamp = Date.now();

                ctx.waitUntil(
                    env.DB.prepare(
                        `INSERT INTO user_feedback (
                            id, rating, comment, platform, format, path, timestamp
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
                    )
                        .bind(
                            id,
                            body.rating || 'neutral',
                            body.comment || null,
                            body.platform || null,
                            body.format || null,
                            body.path || null,
                            timestamp
                        )
                        .run()
                        .catch((err: any) => console.error('D1 feedback insert error:', err))
                );

                return jsonResponse({ success: true, id }, 202);
            }

            // GET /api/telemetry/pull - Export events for local CLI (protected by optional token or open read)
            if (request.method === 'GET' && url.pathname === '/api/telemetry/pull') {
                const authHeader = request.headers.get('Authorization');
                if (env.ADMIN_SECRET && authHeader !== `Bearer ${env.ADMIN_SECRET}`) {
                    return jsonResponse({ error: 'Unauthorized' }, 401);
                }

                const limit = Math.min(Number(url.searchParams.get('limit') || 1000), 5000);
                const since = Number(url.searchParams.get('since') || 0);

                const eventsQuery = env.DB.prepare(
                    'SELECT * FROM events WHERE timestamp > ? ORDER BY timestamp DESC LIMIT ?'
                ).bind(since, limit);

                const feedbackQuery = env.DB.prepare(
                    'SELECT * FROM user_feedback WHERE timestamp > ? ORDER BY timestamp DESC LIMIT ?'
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
