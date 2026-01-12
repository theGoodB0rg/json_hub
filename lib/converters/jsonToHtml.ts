/**
 * Converts flat JSON data to HTML table
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @returns HTML string
 */
export function jsonToHtml(
    data: Record<string, any>[],
    schema: string[]
): string {
    if (data.length === 0 || schema.length === 0) {
        return '<p>No data to export</p>';
    }

    const escapeHtml = (value: any): string => {
        if (value === null || value === undefined) {
            return '<em>null</em>';
        }
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JsonExport - Data View</title>
    <link rel="icon" type="image/svg+xml" href="https://jsonexport.com/icon.svg">
    <style>
        :root {
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --bg: #f8fafc;
            --surface: #ffffff;
            --text: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 20px;
            font-size: 14px;
            line-height: 1.5;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            background: var(--surface);
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: calc(100vh - 40px);
        }
        .header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--surface);
            z-index: 10;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 700;
            font-size: 18px;
            color: var(--text);
        }
        .brand svg {
            height: 28px;
            width: auto;
        }
        .meta {
            font-size: 13px;
            color: var(--text-muted);
        }
        .actions {
            display: flex;
            gap: 12px;
        }
        .btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .btn:hover {
            background: var(--primary-hover);
        }
        .table-wrapper {
            flex: 1;
            overflow: auto;
            position: relative;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            white-space: nowrap;
        }
        th {
            background: #f1f5f9;
            color: var(--text);
            font-weight: 600;
            text-align: left;
            padding: 12px 16px;
            position: sticky;
            top: 0;
            z-index: 5;
            border-bottom: 2px solid var(--border);
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        td {
            padding: 10px 16px;
            border-bottom: 1px solid var(--border);
            color: var(--text);
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        tr:hover {
            background: #eff6ff;
        }
        .null {
            color: var(--text-muted);
            font-style: italic;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        @media (max-width: 640px) {
            body { padding: 0; }
            .container { height: 100vh; border-radius: 0; }
            .header { flex-direction: column; align-items: flex-start; gap: 12px; }
            .actions { width: 100%; }
            .btn { flex: 1; justify-content: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="brand">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" rx="8" fill="#2563eb"/>
                    <path d="M12 20L20 12V17H28V23H20V28L12 20Z" fill="white"/>
                    <path d="M8 8C4 8 4 15 4 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-opacity="0.4"/>
                    <path d="M32 8C36 8 36 15 36 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-opacity="0.4"/>
                </svg>
                JsonExport
            </div>
            <div class="meta">
                ${data.length} rows • ${schema.length} columns • ${new Date().toLocaleDateString()}
            </div>
            <div class="actions">
                <button class="btn" onclick="copyTable()">Copy Data</button>
            </div>
        </header>
        
        <div class="table-wrapper">
            <table id="dataTable">
                <thead>
                    <tr>
                        ${schema.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data
            .map(
                (row) => `
                        <tr>
                            ${schema.map((col) => {
                    const val = row[col];
                    const isNull = val === null || val === undefined;
                    return `<td class="${isNull ? 'null' : ''}">${escapeHtml(val)}</td>`;
                }).join('')}
                        </tr>
                    `
            )
            .join('')}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function copyTable() {
            const table = document.getElementById('dataTable');
            const range = document.createRange();
            range.selectNode(table);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            
            const btn = document.querySelector('.btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Copied!';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        }
    </script>
</body>
</html>
  `.trim();

    return html;
}

/**
 * Downloads HTML file
 * @param data - Array of flat objects
 * @param schema - Column headers
 * @param filename - Output filename
 */
export function downloadHtml(
    data: Record<string, any>[],
    schema: string[],
    filename: string = 'export.html'
): void {
    const htmlContent = jsonToHtml(data, schema);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
