/**
 * Converts JSON to HTML with nested tables (like TableViewGrid component)
 * @param data - JSON data (object or array)
 * @returns HTML string with nested tables
 */
export function jsonToHtmlTableView(data: any): string {
    const items = Array.isArray(data) ? data : [data];

    if (items.length === 0) {
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

    const isPrimitive = (val: any) => val === null || typeof val !== 'object';

    const isPrimitiveArray = (arr: any[]) => arr.every(item => isPrimitive(item));

    // Function to render nested table
    const renderNestedTable = (items: any[]): string => {
        if (items.length === 0) return '';

        const headers = Object.keys(items[0]);

        return `
            <table class="nested-table">
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            ${headers.map(h => {
            const val = item[h];
            if (Array.isArray(val)) {
                if (val.length === 0) return '<td><em>[]</em></td>';
                if (isPrimitiveArray(val)) return `<td>${escapeHtml(val.join(', '))}</td>`;
                return `<td>${renderNestedTable(val)}</td>`;
            } else if (val !== null && typeof val === 'object') {
                return `<td>${renderNestedTable([val])}</td>`;
            } else {
                return `<td>${escapeHtml(val)}</td>`;
            }
        }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    };

    // Analyze structure
    const firstItem = items[0];
    const columns = Object.keys(firstItem);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON Hub Table View Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .info {
            margin-bottom: 20px;
            padding: 12px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
            border: 1px solid #1e40af;
        }
        td {
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
        }
        tr:hover {
            background: #f9fafb;
        }
        em {
            color: #9ca3af;
            font-style: italic;
        }
        /* Nested tables */
        .nested-table {
            width: 100%;
            margin: 0;
            box-shadow: none;
        }
        .nested-table th {
            background: #3b82f6;
            font-size: 0.85em;
            padding: 6px 8px;
        }
        .nested-table td {
            padding: 6px 8px;
            font-size: 0.9em;
        }
        .nested-table .nested-table th {
            background: #60a5fa;
            font-size: 0.75em;
        }
    </style>
</head>
<body>
    <div class="info">
        <h1>JSON Hub Table View Export</h1>
        <p><strong>${items.length}</strong> rows with nested structure</p>
        <p>Exported on ${new Date().toLocaleString()}</p>
    </div>
    <table>
        <thead>
            <tr>
                ${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${items.map(item => `
                <tr>
                    ${columns.map(col => {
        const val = item[col];
        if (Array.isArray(val)) {
            if (val.length === 0) return '<td><em>[]</em></td>';
            if (isPrimitiveArray(val)) return `<td>${escapeHtml(val.join(', '))}</td>`;
            return `<td>${renderNestedTable(val)}</td>`;
        } else if (val !== null && typeof val === 'object') {
            return `<td>${renderNestedTable([val])}</td>`;
        } else {
            return `<td>${escapeHtml(val)}</td>`;
        }
    }).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
  `.trim();

    return html;
}

/**
 * Downloads HTML file with table view structure
 */
export function downloadHtmlTableView(
    data: any,
    filename: string = 'table-export.html'
): void {
    const htmlContent = jsonToHtmlTableView(data);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
