'use client';

/**
 * NestedTable - Hierarchical JSON visualization component
 * Recursively renders JSON as nested tables similar to jsontotable.org
 */

interface NestedTableProps {
    data: any;
    depth?: number;
}

function isPrimitive(value: any): boolean {
    return value === null || typeof value !== 'object';
}

export function NestedTable({ data, depth = 0 }: NestedTableProps) {
    // Base case: primitive values
    if (isPrimitive(data)) {
        if (data === null) {
            return <span className="text-muted-foreground italic">null</span>;
        }
        if (typeof data === 'boolean') {
            return <span className="font-mono">{String(data)}</span>;
        }
        if (typeof data === 'number') {
            return <span className="font-mono text-blue-600 dark:text-blue-400">{data}</span>;
        }
        return <span>{String(data)}</span>;
    }

    // Array: render as indexed rows
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return <span className="text-muted-foreground italic">[]</span>;
        }

        return (
            <table className="nested-table">
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index}>
                            <td className="index-cell">{index}</td>
                            <td>
                                <NestedTable data={item} depth={depth + 1} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    // Object: render as key-value table
    const entries = Object.entries(data);

    if (entries.length === 0) {
        return <span className="text-muted-foreground italic">{'{}'}</span>;
    }

    return (
        <table className="nested-table">
            <tbody>
                {entries.map(([key, value]) => (
                    <tr key={key}>
                        <td className="key-cell" title={key}>
                            <div className="truncate max-w-[200px]">{key}</div>
                        </td>
                        <td className="value-cell">
                            <NestedTable data={value} depth={depth + 1} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
