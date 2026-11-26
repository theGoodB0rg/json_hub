/**
 * The in-chat table view. One self-contained HTML string (no build step, no
 * external requests) that speaks both bridges:
 *  - MCP Apps (`ui/*` JSON-RPC over postMessage): Claude and other MCP hosts.
 *  - `window.openai`: ChatGPT's Apps SDK globals.
 * It only renders the tool's structuredContent and asks the host to open a
 * link or download a file; it never fetches anything itself.
 */
export const WIDGET_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --bg:#ffffff; --fg:#111827; --muted:#6b7280; --line:#e5e7eb; --head:#f9fafb; --accent:#047857; --accent-fg:#ffffff; }
  @media (prefers-color-scheme: dark) { :root { --bg:#111418; --fg:#e5e7eb; --muted:#9ca3af; --line:#2a2f36; --head:#1a1f25; --accent:#34d399; --accent-fg:#06281d; } }
  * { box-sizing: border-box; }
  body { margin:0; padding:12px; background:var(--bg); color:var(--fg); font:14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
  header { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .meta { color:var(--muted); }
  .meta strong { color:var(--fg); }
  .actions { display:flex; gap:8px; flex-wrap:wrap; }
  button { font:inherit; border-radius:8px; padding:6px 12px; cursor:pointer; border:1px solid var(--line); background:var(--bg); color:var(--fg); }
  button.primary { background:var(--accent); color:var(--accent-fg); border-color:var(--accent); }
  .wrap { overflow:auto; max-height:360px; border:1px solid var(--line); border-radius:8px; }
  table { border-collapse:collapse; width:max-content; min-width:100%; }
  th, td { padding:6px 10px; border-bottom:1px solid var(--line); text-align:left; white-space:nowrap; }
  th { position:sticky; top:0; background:var(--head); font-weight:600; }
  .note { margin-top:8px; color:var(--muted); font-size:12px; }
  .empty { color:var(--muted); padding:16px 0; }
</style>
</head>
<body>
<div id="app"><div class="empty">Converting…</div></div>
<script>
(function () {
  var app = document.getElementById('app');
  var data = null;
  var nextId = 0, pending = {};
  var isOpenAI = typeof window.openai === 'object' && window.openai !== null;

  function send(msg) { window.parent.postMessage(msg, '*'); }
  function request(method, params) {
    return new Promise(function (resolve, reject) {
      var id = ++nextId; pending[id] = { resolve: resolve, reject: reject };
      send({ jsonrpc: '2.0', id: id, method: method, params: params });
    });
  }
  function notify(method, params) { send({ jsonrpc: '2.0', method: method, params: params }); }

  function el(tag, text, cls) { var n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; }

  function openSite() {
    if (!data || !data.openUrl) return;
    if (isOpenAI && window.openai.openExternal) window.openai.openExternal({ href: data.openUrl });
    else request('ui/open-link', { url: data.openUrl }).catch(function () {});
  }

  function downloadCsv() {
    request('ui/download-file', { contents: [{ type: 'resource', resource: { uri: 'file:///jsonexport.csv', mimeType: 'text/csv', text: data.csv } }] }).catch(function () {});
  }

  function reportSize() {
    if (!isOpenAI) notify('ui/notifications/size-changed', { width: document.body.scrollWidth, height: document.body.scrollHeight });
  }

  function render(next) {
    if (!next || !next.columns) return;
    data = next;
    app.textContent = '';

    var header = el('header');
    var meta = el('div', null, 'meta');
    meta.appendChild(el('strong', data.rowCount.toLocaleString('en-US') + ' rows'));
    meta.appendChild(document.createTextNode(' × ' + data.columns.length + ' columns'));
    header.appendChild(meta);

    var actions = el('div', null, 'actions');
    // Host-mediated download exists only on the MCP Apps bridge.
    if (!isOpenAI && !data.csvTruncated) {
      var dl = el('button', 'Download CSV'); dl.onclick = downloadCsv; actions.appendChild(dl);
    }
    if (data.openUrl) {
      var open = el('button', 'Open in JsonExport (Excel & more)', 'primary'); open.onclick = openSite; actions.appendChild(open);
    }
    header.appendChild(actions);
    app.appendChild(header);

    var wrap = el('div', null, 'wrap');
    var table = el('table'), thead = el('thead'), tbody = el('tbody'), hr = el('tr');
    data.columns.forEach(function (c) { hr.appendChild(el('th', c)); });
    thead.appendChild(hr);
    data.previewRows.forEach(function (row) {
      var tr = el('tr');
      data.columns.forEach(function (c) { tr.appendChild(el('td', row[c])); });
      tbody.appendChild(tr);
    });
    table.appendChild(thead); table.appendChild(tbody); wrap.appendChild(table); app.appendChild(wrap);

    var shown = data.previewRows.length;
    var note = shown < data.rowCount ? 'Showing the first ' + shown + ' rows. ' : '';
    note += data.openUrl ? 'Excel export runs in your browser on jsonexport.com; the data is never uploaded.' : 'Too large for a link: open jsonexport.com and drop the file there.';
    app.appendChild(el('div', note, 'note'));
    reportSize();
  }

  if (isOpenAI) {
    render(window.openai.toolOutput);
    window.addEventListener('openai:set_globals', function () { render(window.openai.toolOutput); });
    return;
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) return;
    var msg = event.data;
    if (!msg || msg.jsonrpc !== '2.0') return;
    if (msg.id != null && !msg.method && pending[msg.id]) {
      var p = pending[msg.id]; delete pending[msg.id];
      if (msg.error) p.reject(msg.error); else p.resolve(msg.result);
      return;
    }
    if (msg.method === 'ui/notifications/tool-result' && msg.params) render(msg.params.structuredContent);
  });

  request('ui/initialize', {
    appInfo: { name: 'jsonexport-table', version: '1.0.0' },
    appCapabilities: {},
    protocolVersion: '2026-01-26'
  }).then(function () { notify('ui/notifications/initialized', {}); }).catch(function () {});
})();
</script>
</body>
</html>`;
