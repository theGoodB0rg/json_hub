/** Shown when a person opens https://jsonexport.com/mcp in a browser. */
export const LANDING_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JsonExport for ChatGPT and Claude</title>
<meta name="description" content="Turn JSON into a table, CSV or Excel file inside ChatGPT or Claude. Free MCP connector by JsonExport.">
<link rel="canonical" href="https://jsonexport.com/mcp">
<style>
  :root { --bg:#ffffff; --fg:#111827; --muted:#4b5563; --line:#e5e7eb; --code:#f3f4f6; --accent:#047857; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f1216; --fg:#e5e7eb; --muted:#9ca3af; --line:#262b31; --code:#1a1f25; --accent:#34d399; } }
  body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width:720px; margin:0 auto; padding:40px 16px 64px; }
  h1 { font-size:1.9rem; line-height:1.2; margin:0 0 8px; }
  h2 { font-size:1.15rem; margin:32px 0 8px; }
  p, li { color:var(--muted); }
  code { background:var(--code); padding:2px 6px; border-radius:6px; font-size:.95em; }
  .url { display:block; padding:12px 14px; border:1px solid var(--line); border-radius:10px; background:var(--code); font-family:ui-monospace, Consolas, monospace; word-break:break-all; color:var(--fg); }
  a { color:var(--accent); }
</style>
</head>
<body>
<main>
  <h1>JsonExport for ChatGPT and Claude</h1>
  <p>Paste JSON in your chat and get a clean table back: row and column counts, a preview, CSV, and a one-click link to download Excel. Nested fields become columns like <code>address.city</code>, and API envelopes, JSON Lines and escaped JSON are handled for you.</p>

  <h2>Connector URL</h2>
  <span class="url">https://jsonexport.com/mcp</span>

  <h2>Add it to Claude</h2>
  <ol>
    <li>Open Claude, then <strong>Settings → Connectors</strong>.</li>
    <li>Choose <strong>Add custom connector</strong>, name it JsonExport and paste the URL above.</li>
    <li>In a chat, ask: <em>"Turn this JSON into a table"</em> and paste your data.</li>
  </ol>

  <h2>Add it to ChatGPT</h2>
  <ol>
    <li>In ChatGPT, open <strong>Settings → Apps</strong> and turn on developer mode under the advanced settings.</li>
    <li>Create an app, name it JsonExport and paste the URL above (no authentication).</li>
    <li>In a chat, pick JsonExport from the tools menu and paste your JSON.</li>
  </ol>

  <h2>Privacy</h2>
  <p>The connector converts what the chat sends it in memory and keeps nothing: no storage, no logs of your data. The Excel download happens on <a href="https://jsonexport.com">jsonexport.com</a> in your own browser; the data travels in the part of the link after <code>#</code>, which browsers never send to any server.</p>

  <p><a href="https://jsonexport.com">← Back to JsonExport</a></p>
</main>
</body>
</html>`;
