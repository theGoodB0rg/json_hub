import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createServer } from './server';
import { LANDING_HTML } from './landing';

/** JSON-RPC bodies above this are rejected before parsing (input cap is 500k chars). */
const MAX_BODY_BYTES = 2 * 1024 * 1024;

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
};

function withCors(res: Response): Response {
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
    return out;
}

function jsonRpcError(status: number, message: string): Response {
    return withCors(
        new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }), {
            status,
            headers: { 'Content-Type': 'application/json' },
        })
    );
}

/** Stateless Streamable HTTP: a new server + transport per request, no sessions to store. */
async function handleMcp(request: Request): Promise<Response> {
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > MAX_BODY_BYTES) return jsonRpcError(413, 'Request too large');

    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    try {
        await server.connect(transport);
        return withCors(await transport.handleRequest(request));
    } catch (error) {
        console.error('mcp request failed', error instanceof Error ? error.message : error);
        return jsonRpcError(500, 'Internal error');
    } finally {
        void server.close();
    }
}

export default {
    async fetch(request: Request): Promise<Response> {
        const { pathname } = new URL(request.url);
        if (pathname !== '/mcp' && pathname !== '/mcp/') return new Response('Not found', { status: 404 });

        if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
        if (request.method === 'POST') return handleMcp(request);
        if (request.method === 'GET' && (request.headers.get('accept') ?? '').includes('text/html')) {
            return new Response(LANDING_HTML, {
                headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
            });
        }
        // Stateless server: no standalone SSE stream and no sessions to delete.
        return jsonRpcError(405, 'Method not allowed');
    },
};
