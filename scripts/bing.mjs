/**
 * Bing Webmaster Tools from the command line. Standalone (Node 18+, no dependencies), so the
 * same file runs in every site repo; only DEFAULT_SITE differs.
 *   npm run bing                       clicks/impressions summary, last 28 days
 *   npm run bing -- queries [days]     top search queries   (also: pages)
 *   npm run bing -- traffic [days]     clicks and impressions per day
 *   npm run bing -- crawl              crawl stats: pages crawled, in index, errors
 *   npm run bing -- issues             crawl issues Bing found
 *   npm run bing -- sitemaps           sitemaps Bing knows and their status
 *   npm run bing -- inspect <url|path> what Bing knows about one URL
 *   npm run bing -- quota              URL submission quota left
 *   npm run bing -- submit [url...]    submit URLs (default: every URL in the live sitemap)
 *   npm run bing -- sites              sites this key can see
 *   flags: --site https://other.site/  --limit N  --json
 *
 * Key (first match wins): BING_WEBMASTER_API_KEY, or the file ~/.config/bing-webmaster/api_key.
 * Never commit the key. Bing needs up to 48 hours after a site is added before stats appear.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_SITE = 'https://jsonexport.com/';
const API = 'https://ssl.bing.com/webmaster/api.svc/json';

const args = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith('--')) pos.push(a);
  else if (a.includes('=')) flags[a.slice(2, a.indexOf('='))] = a.slice(a.indexOf('=') + 1);
  else if (args[i + 1] && !args[i + 1].startsWith('--')) flags[a.slice(2)] = args[++i];
  else flags[a.slice(2)] = true;
}
const site = String(flags.site || process.env.BING_SITE || DEFAULT_SITE).replace(/\/?$/, '/');
const limit = Number(flags.limit) || 25;
const [cmd = 'summary', ...rest] = pos;

function apiKey() {
  if (process.env.BING_WEBMASTER_API_KEY) return process.env.BING_WEBMASTER_API_KEY.trim();
  try {
    return readFileSync(join(homedir(), '.config', 'bing-webmaster', 'api_key'), 'utf8').trim();
  } catch {
    throw new Error('No Bing API key: set BING_WEBMASTER_API_KEY or create ~/.config/bing-webmaster/api_key '
      + '(Bing Webmaster Tools > Settings > API access > API Key).');
  }
}
const KEY = apiKey();

async function api(method, params = {}, body) {
  const qs = new URLSearchParams({ apikey: KEY, ...params });
  const res = await fetch(`${API}/${method}?${qs}`, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) }
    : undefined);
  const text = await res.text();
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text).d : null;
}

const day = (v) => {
  const ms = Number(/\/Date\((-?\d+)/.exec(v ?? '')?.[1]);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString().slice(0, 10) : ''; // Bing sends year 1 for "never"
};
const since = (days) => Date.now() - days * 864e5;
const inRange = (rows, days) => rows.filter((r) => Number(/\((\d+)/.exec(r.Date ?? '')?.[1]) >= since(days));
const n = (v) => (v == null ? '' : Number(v).toLocaleString('en-US'));
const pos1 = (v) => (v == null || v < 0 ? '' : Number(v).toFixed(1));

function table(title, head, rows) {
  console.log(`\n${title}`);
  if (!rows.length) return console.log('  (no data yet)');
  const all = [head, ...rows.map((r) => r.map((c) => String(c ?? '')))];
  const w = head.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  const line = (r) => '  ' + r.map((c, i) => (i === 0 ? c.padEnd(w[i]) : c.padStart(w[i]))).join('  ');
  console.log(line(head));
  console.log('  ' + w.map((x) => '-'.repeat(x)).join('  '));
  all.slice(1).forEach((r) => console.log(line(r)));
}
const out = (data, render) => (flags.json ? console.log(JSON.stringify(data, null, 2)) : render());

// Aggregates Bing's weekly per-key rows (queries or pages) into one row per key.
function topBy(rows) {
  const m = new Map();
  for (const r of rows) {
    const k = r.Query;
    const e = m.get(k) ?? { key: k, clicks: 0, impressions: 0, posSum: 0 };
    e.clicks += r.Clicks;
    e.impressions += r.Impressions;
    e.posSum += (r.AvgImpressionPosition > 0 ? r.AvgImpressionPosition : 0) * r.Impressions;
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, limit)
    .map((e) => [e.key, n(e.clicks), n(e.impressions), e.impressions ? pos1(e.posSum / e.impressions) : '']);
}

async function sitemapUrls() {
  const seen = new Set();
  const walk = async (url) => {
    if (seen.has(url)) return [];
    seen.add(url);
    const xml = await (await fetch(url)).text();
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    return /<sitemapindex/i.test(xml) ? (await Promise.all(locs.map(walk))).flat() : locs;
  };
  return [...new Set(await walk(`${site}sitemap.xml`))].filter((u) => u.startsWith(site.slice(0, -1)));
}

async function main() {
  if (cmd === 'sites') {
    const r = await api('GetUserSites');
    return out(r, () => table('Sites', ['Site', 'Verified'], r.map((s) => [s.Url, s.IsVerified ? 'yes' : 'no'])));
  }
  if (cmd === 'summary' || cmd === 'traffic') {
    const days = Number(rest[0]) || 28;
    const r = inRange(await api('GetRankAndTrafficStats', { siteUrl: site }), days);
    if (cmd === 'traffic') {
      return out(r, () => table(`Bing traffic, ${site}, last ${days} days`, ['Date', 'Clicks', 'Impressions'],
        r.map((x) => [day(x.Date), n(x.Clicks), n(x.Impressions)])));
    }
    const clicks = r.reduce((s, x) => s + x.Clicks, 0);
    const imps = r.reduce((s, x) => s + x.Impressions, 0);
    const crawl = (await api('GetCrawlStats', { siteUrl: site })).at(-1);
    const quota = await api('GetUrlSubmissionQuota', { siteUrl: site });
    return out({ clicks, impressions: imps, crawl, quota }, () => table(`Bing, ${site}, last ${days} days`, ['Metric', 'Value'], [
      ['Clicks', n(clicks)],
      ['Impressions', n(imps)],
      ['CTR', imps ? `${((clicks / imps) * 100).toFixed(1)}%` : ''],
      ['Pages in index (latest crawl day)', n(crawl?.InIndex)],
      ['Pages crawled (latest crawl day)', n(crawl?.CrawledPages)],
      ['Crawl errors (latest crawl day)', n(crawl?.CrawlErrors)],
      ['URL submissions left today', n(quota?.DailyQuota)],
    ]));
  }
  if (cmd === 'queries' || cmd === 'pages') {
    const days = Number(rest[0]) || 28;
    const r = inRange(await api(cmd === 'queries' ? 'GetQueryStats' : 'GetPageStats', { siteUrl: site }), days);
    return out(r, () => table(`Top ${cmd}, ${site}, last ${days} days`,
      [cmd === 'queries' ? 'Query' : 'Page', 'Clicks', 'Impressions', 'Avg pos'], topBy(r)));
  }
  if (cmd === 'crawl') {
    const r = await api('GetCrawlStats', { siteUrl: site });
    return out(r, () => table(`Crawl stats, ${site}`, ['Date', 'Crawled', 'In index', 'Errors', '2xx', '4xx', '5xx', 'Blocked'],
      r.slice(-limit).map((x) => [day(x.Date), n(x.CrawledPages), n(x.InIndex), n(x.CrawlErrors), n(x.Code2xx), n(x.Code4xx), n(x.Code5xx), n(x.BlockedByRobotsTxt)])));
  }
  if (cmd === 'issues') {
    const r = await api('GetCrawlIssues', { siteUrl: site });
    return out(r, () => table(`Crawl issues, ${site}`, ['URL', 'HTTP', 'Issues'], r.slice(0, limit).map((x) => [x.Url, x.HttpCode, x.Issues])));
  }
  if (cmd === 'sitemaps') {
    const r = await api('GetFeeds', { siteUrl: site });
    return out(r, () => table(`Sitemaps, ${site}`, ['URL', 'Status', 'URLs', 'Last crawled', 'Submitted'],
      r.map((x) => [x.Url, x.Status, n(x.UrlCount), day(x.LastCrawled), day(x.Submitted)])));
  }
  if (cmd === 'inspect') {
    if (!rest[0]) throw new Error('usage: inspect <url or /path>');
    const url = /^https?:/.test(rest[0]) ? rest[0] : site + rest[0].replace(/^\//, '');
    const r = await api('GetUrlInfo', { siteUrl: site, url });
    return out(r, () => table(`What Bing knows about ${url}`, ['Field', 'Value'], [
      ['HTTP status', r?.HttpStatus],
      ['Last crawled', day(r?.LastCrawledDate)],
      ['Discovered', day(r?.DiscoveryDate)],
      ['Document size', n(r?.DocumentSize)],
      ['Anchor links in', n(r?.AnchorCount)],
      ['Total child URLs', n(r?.TotalChildUrlCount)],
    ]));
  }
  if (cmd === 'quota') {
    const r = await api('GetUrlSubmissionQuota', { siteUrl: site });
    return out(r, () => table(`URL submission quota, ${site}`, ['Period', 'Left'], [['Today', n(r.DailyQuota)], ['This month', n(r.MonthlyQuota)]]));
  }
  if (cmd === 'submit') {
    const urls = rest.length ? rest.map((u) => (/^https?:/.test(u) ? u : site + u.replace(/^\//, ''))) : await sitemapUrls();
    const { DailyQuota: left } = await api('GetUrlSubmissionQuota', { siteUrl: site });
    const batch = urls.slice(0, left);
    if (flags['dry-run']) return console.log(`${batch.join('\n')}\n${batch.length} URLs (dry run, ${left} left today)`);
    if (!batch.length) throw new Error(`no submission quota left today for ${site}`);
    for (let i = 0; i < batch.length; i += 500) {
      await api('SubmitUrlBatch', {}, { siteUrl: site, urlList: batch.slice(i, i + 500) });
    }
    console.log(`Submitted ${batch.length} URLs to Bing for ${site}`
      + (batch.length < urls.length ? ` (${urls.length - batch.length} skipped: daily quota)` : ''));
    return;
  }
  throw new Error(`unknown command "${cmd}"; see the header of this file`);
}

// exitCode, not process.exit(): exiting with a fetch socket still open crashes Node on Windows.
process.exitCode = await main().then(() => 0, (e) => (console.error(String(e.message ?? e)), 1));
