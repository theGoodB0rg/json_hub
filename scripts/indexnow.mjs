#!/usr/bin/env node
// Tell IndexNow engines (Bing, Yandex, Seznam, Naver...) about every URL in
// the LIVE sitemap. Run after a production deploy: `npm run indexnow`.
//
//   --dry-run     print the URLs, send nothing
//   --wait=<s>    keep re-checking the key file for up to <s> seconds before
//                 giving up (a fresh deploy can take a moment to go live)
//
// Plain Node 18+, no dependencies. The key is public by design: engines
// verify ownership by fetching it from KEY_LOCATION.

const HOST = 'jsonexport.com';
const ORIGIN = `https://${HOST}`;
const KEY = '25edfd73de372936e6ee81770d81fb5d';
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const SITEMAP = `${ORIGIN}/sitemap.xml`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10000; // IndexNow limit per request

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const waitArg = args.find((a) => a.startsWith('--wait='));
const waitSeconds = waitArg ? Math.max(0, Number(waitArg.split('=')[1]) || 0) : 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The site sits behind a CDN; a query string gets a fresh copy from origin
// so a just-deployed sitemap is not shadowed by a cached one.
function bust(url) {
    const u = new URL(url);
    u.searchParams.set('_', Date.now().toString(36));
    return u.toString();
}

async function fetchText(url) {
    const res = await fetch(url, { redirect: 'follow', headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
    return res.text();
}

function decodeXml(s) {
    return s
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

function locs(xml) {
    return [...xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)].map((m) => decodeXml(m[1].trim()));
}

async function collectUrls(sitemapUrl, seen = new Set()) {
    if (seen.has(sitemapUrl)) return [];
    seen.add(sitemapUrl);
    const xml = await fetchText(bust(sitemapUrl));
    if (/<sitemapindex[\s>]/i.test(xml)) {
        const nested = [];
        for (const child of locs(xml)) nested.push(...(await collectUrls(child, seen)));
        return nested;
    }
    return locs(xml);
}

async function keyIsLive() {
    try {
        const res = await fetch(KEY_LOCATION, { redirect: 'manual' });
        if (res.status !== 200) return `HTTP ${res.status}`;
        const body = (await res.text()).trim();
        return body === KEY ? true : `unexpected body (${body.slice(0, 60)})`;
    } catch (err) {
        return err.message;
    }
}

async function main() {
    const urls = [...new Set(await collectUrls(SITEMAP))].filter((u) => {
        try {
            return new URL(u).host === HOST;
        } catch {
            return false;
        }
    });
    if (urls.length === 0) throw new Error(`No URLs found in ${SITEMAP}`);
    if (urls.length > MAX_URLS) throw new Error(`${urls.length} URLs exceeds the ${MAX_URLS} per-request limit`);

    if (dryRun) {
        for (const u of urls) console.log(u);
        console.log(`\n[dry-run] ${urls.length} URLs would be submitted to ${ENDPOINT}. Nothing sent.`);
        return;
    }

    // An unverified ping is wasted (and repeated failures can get a key
    // ignored), so the key file must be live before we submit.
    const deadline = Date.now() + waitSeconds * 1000;
    let status = await keyIsLive();
    while (status !== true && Date.now() < deadline) {
        console.log(`Key file not live yet (${status}); retrying in 20s...`);
        await sleep(20000);
        status = await keyIsLive();
    }
    if (status !== true) {
        throw new Error(`Key file ${KEY_LOCATION} does not serve the key (${status}). Not submitting.`);
    }

    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
    });
    const text = await res.text().catch(() => '');
    console.log(`IndexNow: submitted ${urls.length} URLs -> HTTP ${res.status} ${res.statusText}`);
    if (text.trim()) console.log(text.trim().slice(0, 500));
    if (res.status !== 200 && res.status !== 202) {
        throw new Error(`IndexNow did not accept the submission (HTTP ${res.status}).`);
    }
    console.log(res.status === 202 ? 'Accepted (202): key validation pending.' : 'Accepted (200).');
}

main().catch((err) => {
    console.error(`indexnow: ${err.message}`);
    process.exit(1);
});
