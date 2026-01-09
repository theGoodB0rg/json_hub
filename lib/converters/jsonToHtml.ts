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
    <title>JSON Hub Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
            background: #f9fafb;
        }
        em {
            color: #9ca3af;
            font-style: italic;
        }
        .info {
            margin-bottom: 20px;
            padding: 12px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="info">
        <h1>JSON Hub Export</h1>
        <p><strong>${data.length}</strong> rows × <strong>${schema.length}</strong> columns</p>
        <p>Exported on ${new Date().toLocaleString()}</p>
    </div>
    <table>
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
                    ${schema.map((col) => `<td>${escapeHtml(row[col])}</td>`).join('')}
                </tr>
            `
            )
            .join('')}
        </tbody>
    </table>
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
