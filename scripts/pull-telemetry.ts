import fs from 'fs';
import path from 'path';
import https from 'https';

interface PullOptions {
    endpoint?: string;
    adminSecret?: string;
    limit?: number;
    outFile?: string;
}

function getEndpointFromEnv(): string {
    if (process.env.TELEMETRY_ENDPOINT) return process.env.TELEMETRY_ENDPOINT;
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const raw = fs.readFileSync(envPath, 'utf-8');
            const match = raw.match(/TELEMETRY_ENDPOINT=["']?([^"'\r\n]+)/);
            if (match) return match[1].trim();
            const publicMatch = raw.match(/NEXT_PUBLIC_TELEMETRY_URL=["']?([^"'\r\n]+)/);
            if (publicMatch) return `${publicMatch[1].trim().replace(/\/$/, '')}/api/telemetry/pull`;
        }
    } catch {
        // ignore error
    }
    return 'https://jsonexport-telemetry.idowue93.workers.dev/api/telemetry/pull';
}

function fetchHttps(urlStr: string, headers: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const options = {
            hostname: u.hostname,
            port: 443,
            path: u.pathname + u.search,
            method: 'GET',
            headers: {
                ...headers,
                'User-Agent': 'jsonexport-telemetry-cli',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid JSON response from telemetry endpoint'));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data || res.statusMessage}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

export async function pullTelemetryData(options: PullOptions = {}) {
    const endpoint = options.endpoint || getEndpointFromEnv();
    const adminSecret = options.adminSecret || process.env.TELEMETRY_ADMIN_SECRET;
    const limit = options.limit || 2000;
    const outDir = path.resolve(process.cwd(), 'performance_data');
    const outFile = options.outFile || path.join(outDir, 'telemetry_latest.json');

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    // Load existing cached data for incremental merge
    let existingEvents: any[] = [];
    let existingFeedback: any[] = [];
    let latestTimestamp = 0;

    if (fs.existsSync(outFile)) {
        try {
            const rawCache = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
            if (Array.isArray(rawCache.events)) existingEvents = rawCache.events;
            if (Array.isArray(rawCache.feedback)) existingFeedback = rawCache.feedback;

            for (const e of existingEvents) {
                if (e.timestamp && e.timestamp > latestTimestamp) latestTimestamp = e.timestamp;
            }
            for (const f of existingFeedback) {
                if (f.timestamp && f.timestamp > latestTimestamp) latestTimestamp = f.timestamp;
            }
        } catch {
            // ignore cache parse error
        }
    }

    const isIncremental = latestTimestamp > 0;
    console.log(
        `[Telemetry Pull] Fetching ${isIncremental ? `incremental (since ${new Date(latestTimestamp).toISOString()})` : 'full'} events from ${endpoint}...`
    );

    try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (adminSecret) {
            headers['Authorization'] = `Bearer ${adminSecret}`;
        }

        const url = `${endpoint}?limit=${limit}${isIncremental ? `&since=${latestTimestamp}` : ''}`;
        const data = await fetchHttps(url, headers);

        // Merge incoming delta with existing cache
        const eventMap = new Map<string, any>();
        for (const e of existingEvents) {
            if (e.id) eventMap.set(e.id, e);
        }
        for (const e of (data.events || [])) {
            if (e.id) eventMap.set(e.id, e);
        }

        const feedbackMap = new Map<string, any>();
        for (const f of existingFeedback) {
            if (f.id) feedbackMap.set(f.id, f);
        }
        for (const f of (data.feedback || [])) {
            if (f.id) feedbackMap.set(f.id, f);
        }

        const mergedEvents = Array.from(eventMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const mergedFeedback = Array.from(feedbackMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const result = {
            events: mergedEvents,
            feedback: mergedFeedback,
            count: {
                events: mergedEvents.length,
                feedback: mergedFeedback.length,
            },
            new_events_received: data.events?.length ?? 0,
            fetched_at: Date.now(),
        };

        fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8');

        console.log(
            `[Telemetry Pull] Successfully synced ${result.count.events} total events (+${result.new_events_received} new) and ${result.count.feedback} feedback records to ${outFile}`
        );
        return result;
    } catch (error: any) {
        console.warn(`[Telemetry Pull] Note: Remote fetch failed (${error.message}). Using local cache.`);
        const fallback = {
            events: existingEvents,
            feedback: existingFeedback,
            count: { events: existingEvents.length, feedback: existingFeedback.length },
            fetched_at: Date.now(),
            offline_fallback: true,
        };
        if (!fs.existsSync(outFile)) {
            fs.writeFileSync(outFile, JSON.stringify(fallback, null, 2), 'utf-8');
        }
        return fallback;
    }
}

if (require.main === module) {
    pullTelemetryData();
}
