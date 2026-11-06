/**
 * Post-build: wrap every element in out/**\/*.html that shows an email address in
 * <!--email_off--> ... <!--/email_off--> so Cloudflare Email Obfuscation leaves it alone.
 *
 * Every email the site renders is sample data (hero demo, code samples, test-data pages).
 * Without this, Cloudflare rewrites them to <a href="/cdn-cgi/l/email-protection">[email protected]</a>,
 * which 404s for crawlers (Ahrefs: "page has links to broken page" on ~60 pages) and corrupts
 * the sample JSON that crawlers and AI tools read. Obfuscation stays on for everything else.
 *
 * Markers are placed at element boundaries, never inside a text node: React 18 hydration skips
 * comments that are not Suspense markers, so the hydrated tree is unchanged.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
const SKIP_TAGS = new Set(['script', 'style', 'template']);
// Wrap the whole block when an email sits inside one: fewer markers, same effect.
const BLOCK_TAGS = new Set(['pre', 'table']);
// Never wrap these themselves; fall back to the text node instead.
const ROOT_TAGS = new Set(['html', 'head', 'body']);
const OPEN = '<!--email_off-->';
const CLOSE = '<!--/email_off-->';

function findHtmlFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...findHtmlFiles(full));
        else if (entry.name.endsWith('.html')) files.push(full);
    }
    return files;
}

/** [start, end) offsets of existing email_off blocks, so reruns are no-ops. */
function protectedRanges(html) {
    const ranges = [];
    let i = 0;
    while ((i = html.indexOf(OPEN, i)) !== -1) {
        const end = html.indexOf(CLOSE, i);
        if (end === -1) break;
        ranges.push([i, end + CLOSE.length]);
        i = end + CLOSE.length;
    }
    return ranges;
}

function targetFor(node) {
    // node is a text node, or an element with an email in an attribute
    let el = node.type === 'text' ? node.parent : node;
    for (let a = el; a && a.type === 'tag'; a = a.parent) {
        if (BLOCK_TAGS.has(a.name)) return a;
    }
    if (el && el.type === 'tag' && !ROOT_TAGS.has(el.name)) return el;
    return node.type === 'text' ? node : null;
}

function wrapFile(html) {
    const $ = cheerio.load(html, { sourceCodeLocationInfo: true });
    const done = protectedRanges(html);
    const isProtected = (s, e) => done.some(([ps, pe]) => s >= ps && e <= pe);
    const ranges = [];

    const visit = (node) => {
        if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
            if (SKIP_TAGS.has(node.name)) return;
            const hasEmailAttr = Object.values(node.attribs || {}).some((v) => EMAIL_RE.test(v));
            if (hasEmailAttr) push(node);
            (node.children || []).forEach(visit);
        } else if (node.type === 'text') {
            if (EMAIL_RE.test(node.data)) push(node);
        } else if (node.children) {
            node.children.forEach(visit);
        }
    };
    const push = (node) => {
        const t = targetFor(node);
        const loc = t && t.sourceCodeLocation;
        if (!loc || loc.startOffset == null || loc.endOffset == null) return;
        if (isProtected(loc.startOffset, loc.endOffset)) return;
        ranges.push([loc.startOffset, loc.endOffset]);
    };
    $.root()[0].children.forEach(visit);
    if (!ranges.length) return null;

    // Keep outermost ranges only.
    ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const merged = [];
    for (const r of ranges) {
        const last = merged[merged.length - 1];
        if (last && r[0] < last[1]) continue; // nested inside (or same as) previous
        merged.push(r);
    }
    let out = html;
    for (let k = merged.length - 1; k >= 0; k--) {
        const [s, e] = merged[k];
        out = out.slice(0, s) + OPEN + out.slice(s, e) + CLOSE + out.slice(e);
    }
    return { html: out, count: merged.length };
}

if (require.main === module) {
    const outDir = path.resolve(__dirname, '..', process.argv[2] || 'out');
    let files = 0;
    let blocks = 0;
    for (const filePath of findHtmlFiles(outDir)) {
        const result = wrapFile(fs.readFileSync(filePath, 'utf-8'));
        if (!result) continue;
        fs.writeFileSync(filePath, result.html, 'utf-8');
        files++;
        blocks += result.count;
    }
    console.log(`email_off: wrapped ${blocks} block(s) in ${files} HTML file(s)`);
}

module.exports = { wrapFile };
