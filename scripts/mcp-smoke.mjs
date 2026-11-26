#!/usr/bin/env node
/**
 * End-to-end check of the ChatGPT / Claude connector with the official MCP client.
 *   node scripts/mcp-smoke.mjs                       # production
 *   node scripts/mcp-smoke.mjs http://127.0.0.1:8799/mcp   # wrangler dev
 * Exits non-zero on the first failed check.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = new URL(process.argv[2] ?? 'https://jsonexport.com/mcp');
const sample = JSON.stringify({
    data: [
        { id: 1, customer: { name: 'Ada', city: 'Lagos' }, total: 12.5 },
        { id: 2, customer: { name: 'Bayo', city: 'Ibadan' }, total: 7 },
    ],
});

function check(cond, label) {
    if (!cond) {
        console.error(`FAIL  ${label}`);
        process.exit(1);
    }
    console.log(`ok    ${label}`);
}

const client = new Client({ name: 'jsonexport-smoke', version: '1.0.0' });
await client.connect(new StreamableHTTPClientTransport(url));
check(client.getServerVersion()?.name === 'jsonexport', 'initialize: server is jsonexport');

const { tools } = await client.listTools();
const tool = tools.find((t) => t.name === 'json_to_table');
check(tool, 'tools/list: json_to_table present');
check(tool._meta?.ui?.resourceUri === 'ui://jsonexport/table.html', 'tool links the MCP Apps view');
check(tool._meta?.['openai/outputTemplate'] === 'ui://jsonexport/table-chatgpt.html', 'tool links the ChatGPT view');

const { resources } = await client.listResources();
check(resources.length === 2, 'resources/list: both views listed');
const view = await client.readResource({ uri: 'ui://jsonexport/table.html' });
check(view.contents[0].mimeType === 'text/html;profile=mcp-app' && view.contents[0].text.includes('ui/initialize'), 'resources/read: MCP Apps view served');

let t = Date.now();
const result = await client.callTool({ name: 'json_to_table', arguments: { json: sample } });
const ms = Date.now() - t;
check(!result.isError, `tools/call: converted (${ms} ms round trip)`);
check(result.structuredContent.rowCount === 2, 'structuredContent: 2 rows');
check(result.structuredContent.columns.includes('customer.city'), 'structuredContent: nested column flattened');
check(/#share=/.test(result.structuredContent.openUrl), 'structuredContent: open link carries data in the fragment');
check(result.content[0].text.includes('```csv'), 'text reply: CSV block for clients without a UI');

const bad = await client.callTool({ name: 'json_to_table', arguments: { json: '{oops' } });
check(bad.isError === true, 'tools/call: invalid JSON returns a readable error');

const big = JSON.stringify(Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `row ${i}`, tags: ['a', 'b'], meta: { n: i * 2 } })));
t = Date.now();
const heavy = await client.callTool({ name: 'json_to_table', arguments: { json: big } });
check(!heavy.isError && heavy.structuredContent.rowCount === 5000, `tools/call: 5,000 rows (${big.length.toLocaleString()} chars) in ${Date.now() - t} ms`);

await client.close();
console.log(`\nAll checks passed against ${url}`);
