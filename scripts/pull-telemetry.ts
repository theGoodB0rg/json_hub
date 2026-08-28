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

    console.log(`[Telemetry Pull] Fetching latest events from ${endpoint}...`);

    try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (adminSecret) {
            headers['Authorization'] = `Bearer ${adminSecret}`;
        }

        const url = `${endpoint}?limit=${limit}`;
        const data = await fetchHttps(url, headers);

        fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf-8');

        console.log(
            `[Telemetry Pull] Successfully saved ${data.count?.events ?? 0} events and ${data.count?.feedback ?? 0} feedback items to ${outFile}`
        );
        return data;
    } catch (error: any) {
        console.warn(`[Telemetry Pull] Note: Remote fetch failed (${error.message}). Creating fallback.`);
        const fallback = {
            events: [],
            feedback: [],
            count: { events: 0, feedback: 0 },
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
