import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';

export interface GscApiRow {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscLiveReport {
    siteUrl: string;
    startDate: string;
    endDate: string;
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    pages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

export interface GscCredentials {
    clientEmail: string;
    privateKey: string;
    siteUrl: string;
}

function loadEnvLocal(): void {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const raw = fs.readFileSync(envPath, 'utf8');
            const lines = raw.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx !== -1) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    let val = trimmed.slice(eqIdx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        }
    } catch {
        // Ignore read errors
    }
}

/**
 * Loads credentials from .env.local or service account JSON file
 */
export function getGscCredentials(): GscCredentials {
    loadEnvLocal();

    // 1. Check if a JSON file path is specified
    const keyFilePath = process.env.GSC_KEY_FILE;
    if (keyFilePath) {
        const fullPath = path.resolve(process.cwd(), keyFilePath);
        if (fs.existsSync(fullPath)) {
            const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            return {
                clientEmail: raw.client_email,
                privateKey: raw.private_key,
                siteUrl: process.env.GSC_SITE_URL || 'https://jsonexport.com/',
            };
        }
    }

    // 2. Check individual environment variables
    const clientEmail = process.env.GSC_CLIENT_EMAIL;
    const rawPrivateKey = process.env.GSC_PRIVATE_KEY;
    const siteUrl = process.env.GSC_SITE_URL || 'https://jsonexport.com/';

    if (!clientEmail || !rawPrivateKey) {
        throw new Error(
            '\n❌ Missing Google Search Console API credentials!\n' +
            '----------------------------------------------------------------------\n' +
            'To perform a full live GSC data pull without fallbacks, please add either:\n' +
            '  1. GSC_KEY_FILE="./gsc-credentials.json"\n' +
            '  OR\n' +
            '  2. GSC_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"\n' +
            '     GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"\n' +
            'in your `.env.local` file.\n' +
            '----------------------------------------------------------------------\n'
        );
    }

    // Normalize private key escaped newlines
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    return {
        clientEmail,
        privateKey,
        siteUrl,
    };
}

/**
 * Generates an OAuth2 Access Token for Google Search Console API using native crypto JWT
 */
export async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    const claimSet = {
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    };

    const encodeBase64Url = (obj: object) =>
        Buffer.from(JSON.stringify(obj))
            .toString('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

    const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(claimSet)}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsignedToken);
    signer.end();

    const signature = signer
        .sign(privateKey, 'base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const jwt = `${unsignedToken}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Failed to obtain Google OAuth2 token: ${tokenRes.status} ${errText}`);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    return tokenData.access_token;
}

/**
 * Queries Google Search Console Search Analytics API for the last 28 days
 */
export async function fetchLiveGscData(): Promise<GscLiveReport> {
    const creds = getGscCredentials();
    const accessToken = await getGoogleAccessToken(creds.clientEmail, creds.privateKey);

    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 28);
    const startDate = startDateObj.toISOString().split('T')[0];

    const encodedSiteUrl = encodeURIComponent(creds.siteUrl);
    const apiUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    console.log(`[GSC API] Fetching live search data for ${creds.siteUrl} (${startDate} to ${endDate})...`);

    // 1. Fetch Queries
    const queryRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ['query'],
            rowLimit: 500,
        }),
    });

    if (!queryRes.ok) {
        const errText = await queryRes.text();
        throw new Error(`Google Search Console API error (queries): ${queryRes.status} ${errText}`);
    }

    const queryData = (await queryRes.json()) as { rows?: GscApiRow[] };

    // 2. Fetch Pages
    const pageRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ['page'],
            rowLimit: 500,
        }),
    });

    if (!pageRes.ok) {
        const errText = await pageRes.text();
        throw new Error(`Google Search Console API error (pages): ${pageRes.status} ${errText}`);
    }

    const pageData = (await pageRes.json()) as { rows?: GscApiRow[] };

    const queries = (queryData.rows || []).map((r) => ({
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
    }));

    const pages = (pageData.rows || []).map((r) => ({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
    }));

    const totalClicks = queries.reduce((sum, r) => sum + r.clicks, 0);
    const totalImpressions = queries.reduce((sum, r) => sum + r.impressions, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition =
        queries.length > 0 ? queries.reduce((sum, r) => sum + r.position, 0) / queries.length : 0;

    return {
        siteUrl: creds.siteUrl,
        startDate,
        endDate,
        totalClicks,
        totalImpressions,
        avgCtr,
        avgPosition,
        queries,
        pages,
    };
}

// Standalone runner
if (require.main === module) {
    (async () => {
        try {
            console.log('\n=============================================');
            console.log('📡 GOOGLE SEARCH CONSOLE LIVE API DATA PULL');
            console.log('=============================================\n');
            const data = await fetchLiveGscData();
            console.log(`✅ Successfully pulled ${data.queries.length} queries and ${data.pages.length} pages from GSC API.`);
            console.log(`• Total Clicks: ${data.totalClicks}`);
            console.log(`• Total Impressions: ${data.totalImpressions}`);
            console.log(`• Avg CTR: ${data.avgCtr.toFixed(2)}%`);
            console.log(`• Avg Position: ${data.avgPosition.toFixed(1)}`);

            const outDir = path.resolve(process.cwd(), 'performance_data');
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.join(outDir, 'gsc_live_latest.json'), JSON.stringify(data, null, 2), 'utf8');
            console.log('💾 Saved live data to performance_data/gsc_live_latest.json\n');
        } catch (err: any) {
            console.error(err.message || err);
            process.exit(1);
        }
    })();
}
