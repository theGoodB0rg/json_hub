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

/** One calendar month of search performance, rolled up from the DATE
 *  dimension. `days` is how many days of that month actually carried data,
 *  which is what makes the current (partial) month comparable to past ones. */
export interface GscTrendMonth {
    month: string; // YYYY-MM
    days: number;
    clicks: number;
    impressions: number;
    ctr: number; // percent
    clicksPerDay: number;
    /** Impression-weighted mean position across the month's days. */
    avgPosition: number;
}

/** Like-for-like comparison of the current partial month against the same
 *  day-span of the previous month.
 *
 *  Why this exists: the current month is always partial, so comparing its
 *  running total against a previous full month reads as a collapse even when
 *  the site is flat. Measured on 2026-10-10, October showed 22 clicks vs
 *  September's 151 — a false "-85%" — while the honest Oct 1-6 vs Sep 1-6
 *  comparison was 22 vs 24, i.e. flat. Always compare equal day spans. */
export interface GscTrendMomentum {
    /** Number of days of the current month that carry data. */
    daySpan: number;
    currentMonth: string;
    currentClicks: number;
    previousMonth: string;
    /** Clicks over the SAME day span of the previous month, not its total. */
    previousClicks: number;
    /** Percent change over the matched span. null when there is no baseline. */
    changePct: number | null;
}

export interface GscTrend {
    months: GscTrendMonth[];
    momentum: GscTrendMomentum | null;
    /** Trailing daily rows, most recent last. Used for the sparkline. */
    recentDays: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

export interface GscLiveReport {
    siteUrl: string;
    startDate: string;
    endDate: string;
    /** Site-wide totals from the DATE dimension — the only dimension Google
     *  does not truncate. See the comment in fetchLiveGscData. */
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    /** Impression-weighted mean position. A plain mean over query rows
     *  over-weights long-tail terms with a single impression. */
    avgPosition: number;
    /** What the query dimension alone accounts for, and therefore how much of
     *  the site's traffic the per-query breakdown can explain. */
    queryCoverage: {
        clicks: number;
        impressions: number;
        clickShare: number;
        impressionShare: number;
    };
    queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    pages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
    /** Long-window month-over-month trend. Absent only if the trend fetch
     *  failed — the 28-day snapshot above is still valid without it. */
    trend?: GscTrend;
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
/** How far back the trend query reaches. GSC retains ~16 months; 180 days is
 *  enough to show the growth curve without making the report slow. */
const TREND_WINDOW_DAYS = 180;

/** Build the month-over-month trend from the DATE dimension.
 *
 *  Uses DATE rather than any other dimension for the same reason the totals
 *  do: Google truncates query/page rows but never date rows, so this is the
 *  only breakdown whose numbers reconcile with the site totals. */
export async function fetchGscTrend(apiUrl: string, accessToken: string): Promise<GscTrend> {
    const endDate = new Date().toISOString().split('T')[0];
    const startObj = new Date();
    startObj.setDate(startObj.getDate() - TREND_WINDOW_DAYS);
    const startDate = startObj.toISOString().split('T')[0];

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, dimensions: ['date'], rowLimit: 1000 }),
    });

    if (!res.ok) {
        throw new Error(`Google Search Console API error (trend): ${res.status} ${await res.text()}`);
    }

    const rows = ((await res.json()) as { rows?: GscApiRow[] }).rows || [];
    const days = rows
        .map((r) => ({
            date: r.keys[0],
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr * 100,
            position: r.position,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Roll up into calendar months.
    const buckets = new Map<string, { clicks: number; impressions: number; days: number; posWeighted: number }>();
    for (const d of days) {
        const key = d.date.slice(0, 7);
        const b = buckets.get(key) || { clicks: 0, impressions: 0, days: 0, posWeighted: 0 };
        b.clicks += d.clicks;
        b.impressions += d.impressions;
        b.days += 1;
        b.posWeighted += d.position * d.impressions;
        buckets.set(key, b);
    }

    const months: GscTrendMonth[] = [...buckets.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, b]) => ({
            month,
            days: b.days,
            clicks: b.clicks,
            impressions: b.impressions,
            ctr: b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0,
            clicksPerDay: b.days > 0 ? b.clicks / b.days : 0,
            avgPosition: b.impressions > 0 ? b.posWeighted / b.impressions : 0,
        }));

    // Like-for-like momentum: current partial month vs the same day span of
    // the month before. See GscTrendMomentum for why a whole-month baseline
    // would be actively misleading here.
    let momentum: GscTrendMomentum | null = null;
    if (months.length >= 2) {
        const current = months[months.length - 1];
        const previous = months[months.length - 2];
        const daySpan = current.days;
        const previousSameSpan = days
            .filter((d) => d.date.slice(0, 7) === previous.month)
            .slice(0, daySpan)
            .reduce((sum, d) => sum + d.clicks, 0);

        momentum = {
            daySpan,
            currentMonth: current.month,
            currentClicks: current.clicks,
            previousMonth: previous.month,
            previousClicks: previousSameSpan,
            changePct: previousSameSpan > 0 ? ((current.clicks - previousSameSpan) / previousSameSpan) * 100 : null,
        };
    }

    return { months, momentum, recentDays: days.slice(-30) };
}

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

    // 3. Fetch site-wide totals from the DATE dimension.
    //
    // Why this exists: summing the `query` dimension under-reports badly.
    // Google withholds queries that are rare enough to identify a user, so
    // those clicks and impressions are simply absent from the query rows —
    // they are not redistributed. Measured on 2026-10-10 over a 28-day window,
    // the query dimension accounted for 49 of 125 real clicks and 3,356 of
    // 5,029 real impressions: a 61% under-report of clicks. The date dimension
    // is never truncated this way, so it is the correct source for totals.
    const dateRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ['date'],
            rowLimit: 1000,
        }),
    });

    if (!dateRes.ok) {
        const errText = await dateRes.text();
        throw new Error(`Google Search Console API error (totals): ${dateRes.status} ${errText}`);
    }

    const dateData = (await dateRes.json()) as { rows?: GscApiRow[] };
    const dateRows = dateData.rows || [];

    const totalClicks = dateRows.reduce((sum, r) => sum + r.clicks, 0);
    const totalImpressions = dateRows.reduce((sum, r) => sum + r.impressions, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Impression-weighted position. GSC's own "average position" is weighted
    // this way; an unweighted mean over query rows is dominated by long-tail
    // terms with one impression apiece and reads far worse than reality.
    const weightedImpressions = queries.reduce((sum, r) => sum + r.impressions, 0);
    const avgPosition =
        weightedImpressions > 0
            ? queries.reduce((sum, r) => sum + r.position * r.impressions, 0) / weightedImpressions
            : 0;

    const queryClicks = queries.reduce((sum, r) => sum + r.clicks, 0);
    const queryImpressions = weightedImpressions;

    // 4. Long-window trend. Non-fatal: a trend failure must not take down the
    //    28-day snapshot, which is the part the rest of the report depends on.
    let trend: GscTrend | undefined;
    try {
        trend = await fetchGscTrend(apiUrl, accessToken);
    } catch (err) {
        console.warn(`[GSC API] Trend fetch failed, continuing without it: ${err instanceof Error ? err.message : String(err)}`);
    }

    return {
        siteUrl: creds.siteUrl,
        startDate,
        endDate,
        totalClicks,
        totalImpressions,
        avgCtr,
        avgPosition,
        queryCoverage: {
            clicks: queryClicks,
            impressions: queryImpressions,
            clickShare: totalClicks > 0 ? queryClicks / totalClicks : 0,
            impressionShare: totalImpressions > 0 ? queryImpressions / totalImpressions : 0,
        },
        queries,
        pages,
        trend,
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
