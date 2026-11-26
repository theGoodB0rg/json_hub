import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker';
import { z } from 'zod';
import { chatSummary, convertForChat, LIMITS } from './convert';
import { WIDGET_HTML } from './widget';

export const SERVER_INFO = { name: 'jsonexport', version: '1.0.0' } as const;

/** The same view under the two MIME types hosts look for. */
const VIEWS = [
    { name: 'table-view', uri: 'ui://jsonexport/table.html', mimeType: 'text/html;profile=mcp-app' }, // MCP Apps standard
    { name: 'table-view-chatgpt', uri: 'ui://jsonexport/table-chatgpt.html', mimeType: 'text/html+skybridge' }, // ChatGPT Apps SDK
] as const;

const TOOL_DESCRIPTION = [
    'Convert JSON (an array of records, an API response, nested objects, JSON Lines or escaped JSON) into a spreadsheet table.',
    'Returns the row and column count, a CSV and a link that opens the data in JsonExport,',
    'where the user can download Excel (.xlsx), CSV or HTML. Nested fields become columns like address.city.',
    'Use it whenever the user wants JSON as a table, CSV, spreadsheet or Excel file.',
    'For Excel, give the user the link from the result: the file is built in their browser and never uploaded.',
].join(' ');

/**
 * Builds a fresh, stateless server. One per request keeps the worker free of
 * shared state, so it scales horizontally with no coordination.
 */
export function createServer(): McpServer {
    const server = new McpServer(SERVER_INFO, { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() });

    for (const view of VIEWS) {
        server.registerResource(view.name, view.uri, { title: 'JsonExport table', mimeType: view.mimeType }, async () => ({
            contents: [{ uri: view.uri, mimeType: view.mimeType, text: WIDGET_HTML }],
        }));
    }

    server.registerTool(
        'json_to_table',
        {
            title: 'Convert JSON to a table, CSV or Excel',
            description: TOOL_DESCRIPTION,
            inputSchema: {
                json: z
                    .string()
                    .min(1)
                    .max(LIMITS.maxInputChars)
                    .describe('The JSON text exactly as the user gave it. Do not summarise or reformat it.'),
            },
            annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
            _meta: {
                ui: { resourceUri: VIEWS[0].uri },
                'openai/outputTemplate': VIEWS[1].uri,
                'openai/toolInvocation/invoking': 'Converting JSON…',
                'openai/toolInvocation/invoked': 'Table ready',
            },
        },
        async ({ json }) => {
            const outcome = convertForChat(json);
            if (!outcome.ok) return { isError: true, content: [{ type: 'text', text: outcome.error }] };
            return {
                content: [{ type: 'text', text: chatSummary(outcome.value) }],
                structuredContent: { ...outcome.value },
            };
        }
    );

    return server;
}
