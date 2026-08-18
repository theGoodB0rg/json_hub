const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const runAll = args.size === 0;
const runSlugs = runAll || args.has('--slugs');
const runLinks = runAll || args.has('--links');
const runSitemap = runAll || args.has('--sitemap');

const failures = [];

function readFile(relPath) {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function lineFromIndex(content, index) {
    return content.slice(0, index).split('\n').length;
}

function addFailure(message) {
    failures.push(message);
}

function extractMatches(content, regex) {
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        matches.push({
            value: match[1],
            index: match.index,
        });
    }
    return matches;
}

function walkDir(dirPath, filterFn, output = []) {
    if (!fs.existsSync(dirPath)) {
        return output;
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const absPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            walkDir(absPath, filterFn, output);
            continue;
        }
        if (filterFn(absPath)) {
            output.push(absPath);
        }
    }
    return output;
}

function routeExists(pathname) {
    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const appBase = path.join(ROOT, 'app');

    if (normalizedPath === '/') {
        return fs.existsSync(path.join(appBase, 'page.tsx')) || fs.existsSync(path.join(appBase, 'page.ts'));
    }

    const segments = normalizedPath.split('/').filter(Boolean);
    const routeDir = path.join(appBase, ...segments);
    const routeFiles = ['page.tsx', 'page.ts', 'route.ts', 'route.js'];

    if (routeFiles.some((fileName) => fs.existsSync(path.join(routeDir, fileName)))) {
        return true;
    }

    // Dynamic routes support
    if (segments.length === 1 && fs.existsSync(path.join(appBase, '[conversion]', 'page.tsx'))) {
        return true;
    }
    if (segments.length === 2 && segments[0] === 'converters' && fs.existsSync(path.join(appBase, 'converters', '[slug]', 'page.tsx'))) {
        return true;
    }
    if (segments.length === 2 && segments[0] === 'blog' && fs.existsSync(path.join(appBase, 'blog', '[slug]', 'page.tsx'))) {
        return true;
    }
    if (segments.length === 2 && segments[0] === 'test-data' && fs.existsSync(path.join(appBase, 'test-data', '[slug]', 'page.tsx'))) {
        return true;
    }

    return false;
}

function collectConverterSlugs() {
    const platformFile = 'lib/platform-data.ts';
    const platformContent = readFile(platformFile);
    const slugRegex = /slug:\s*'([^']+)'/g;
    const slugMatches = extractMatches(platformContent, slugRegex);

    const slugs = slugMatches.map((match) => match.value);
    const uniqueSlugs = new Set(slugs);

    if (uniqueSlugs.size !== slugs.length) {
        const seen = new Set();
        for (const slug of slugs) {
            if (seen.has(slug)) {
                addFailure(`Duplicate converter slug in ${platformFile}: "${slug}"`);
            }
            seen.add(slug);
        }
    }

    return uniqueSlugs;
}

function collectRouteMap() {
    const routesFile = 'lib/routes.ts';
    const routesContent = readFile(routesFile);
    const routeRegex = /^\s*([A-Za-z0-9_]+):\s*'([^']+)'/gm;
    const routeMap = new Map();

    let match;
    while ((match = routeRegex.exec(routesContent)) !== null) {
        routeMap.set(match[1], match[2]);
    }

    return routeMap;
}

function checkDummyDatasetSlugs(converterSlugs) {
    const dummyFile = 'lib/dummy-data.ts';
    const dummyContent = readFile(dummyFile);
    const converterSlugRegex = /converterSlug:\s*'([^']+)'/g;
    const slugMatches = extractMatches(dummyContent, converterSlugRegex);

    for (const match of slugMatches) {
        if (!converterSlugs.has(match.value)) {
            const line = lineFromIndex(dummyContent, match.index);
            addFailure(`${dummyFile}:${line} has unknown converterSlug "${match.value}"`);
        }
    }
}

function checkMarkdownConverterLinks(converterSlugs) {
    const contentDir = path.join(ROOT, 'content');
    const markdownFiles = walkDir(contentDir, (filePath) => /\.(md|mdx)$/i.test(filePath));
    const converterLinkRegex = /(?:https?:\/\/jsonexport\.com)?\/converters\/([a-z0-9-]+)/g;

    for (const absFilePath of markdownFiles) {
        const relPath = path.relative(ROOT, absFilePath).replace(/\\/g, '/');
        const fileContent = fs.readFileSync(absFilePath, 'utf8');
        const linkMatches = extractMatches(fileContent, converterLinkRegex);

        for (const match of linkMatches) {
            if (!converterSlugs.has(match.value)) {
                const line = lineFromIndex(fileContent, match.index);
                addFailure(`${relPath}:${line} links to unknown converter slug "${match.value}"`);
            }
        }
    }
}

function checkSitemapStaticRoutes() {
    const sitemapFile = 'app/sitemap.ts';
    const sitemapContent = readFile(sitemapFile);
    const staticUrlRegex = /url:\s*'https:\/\/jsonexport\.com([^']*)'/g;
    const staticRouteMatches = extractMatches(sitemapContent, staticUrlRegex);
    const routeMap = collectRouteMap();
    const routeRefRegex = /url:\s*toAbsoluteUrl\(ROUTES\.([A-Za-z0-9_]+)\)/g;

    for (const match of staticRouteMatches) {
        const pathname = match.value || '/';
        if (!routeExists(pathname)) {
            const line = lineFromIndex(sitemapContent, match.index);
            addFailure(`${sitemapFile}:${line} references static URL path "${pathname}" with no matching app route`);
        }
    }

    let routeMatch;
    while ((routeMatch = routeRefRegex.exec(sitemapContent)) !== null) {
        const routeKey = routeMatch[1];
        if (!routeMap.has(routeKey)) {
            const line = lineFromIndex(sitemapContent, routeMatch.index);
            addFailure(`${sitemapFile}:${line} references unknown ROUTES key "${routeKey}"`);
            continue;
        }

        const pathname = routeMap.get(routeKey);
        if (!routeExists(pathname)) {
            const line = lineFromIndex(sitemapContent, routeMatch.index);
            addFailure(`${sitemapFile}:${line} references route "${routeKey}" (${pathname}) with no matching app route`);
        }
    }
}

const converterSlugs = collectConverterSlugs();

if (runSlugs) {
    checkDummyDatasetSlugs(converterSlugs);
}

if (runLinks) {
    checkMarkdownConverterLinks(converterSlugs);
}

if (runSitemap) {
    checkSitemapStaticRoutes();
}

if (failures.length > 0) {
    console.error('SEO integrity checks failed:');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('SEO integrity checks passed.');
