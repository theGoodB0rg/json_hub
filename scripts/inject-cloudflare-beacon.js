const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...findHtmlFiles(full));
        else if (entry.name.endsWith('.html')) files.push(full);
    }
    return files;
}

const token = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN || '0810b14a4ea44fa4bd762d3297630408';
const snippet = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script>`;

const outDir = path.resolve(__dirname, '..', 'out');
const files = findHtmlFiles(outDir);

let count = 0;
for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(snippet)) continue;
    content = content.replace('</body>', `${snippet}</body>`);
    fs.writeFileSync(filePath, content, 'utf-8');
    count++;
}

if (count > 0) {
    console.log(`Injected Cloudflare beacon into ${count} HTML file(s) (token: ${token})`);
} else {
    console.log('Cloudflare beacon already present in all HTML files');
}
