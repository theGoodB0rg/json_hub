'use client';

import { useMemo } from 'react';

interface TableViewGridProps {
    data: any;
}

/**
 * TableViewGrid - Renders JSON with nested tables in cells
 * Matches jsontotable.org's visual structure
 */
export function TableViewGrid({ data }: TableViewGridProps) {
    const tableStructure = useMemo(() => analyzeStructure(data), [data]);

    if (!tableStructure) {
        return (
            <div className="p-4 text-muted-foreground">
                No data to display
            </div>
        );
    }

    return (
        <div className="overflow-auto">
            <table className="w-full text-sm border-collapse">
                <thead className="bg-muted sticky top-0">
                    <tr>
                        {tableStructure.columns.map((col, idx) => (
                            <th
                                key={idx}
                                className="px-3 py-2 text-left font-semibold border border-border"
                            >
                                {col.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableStructure.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-muted/50">
                            {tableStructure.columns.map((col, colIdx) => {
                                const cellData = row[col.name];
                                return (
                                    <td
                                        key={colIdx}
                                        className="px-3 py-2 border border-border align-top"
                                    >
                                        {renderCell(cellData, col.type)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/**
 * Analyzes JSON structure to determine columns and types
 */
function analyzeStructure(data: any) {
    if (!data) return null;

    // Handle arrays
    const items = Array.isArray(data) ? data : [data];
    if (items.length === 0) return null;

    // Get all unique keys from first item
    const firstItem = items[0];
    const columns: Array<{ name: string; type: 'primitive' | 'array' | 'object' }> = [];

    for (const [key, value] of Object.entries(firstItem)) {
        let type: 'primitive' | 'array' | 'object' = 'primitive';

        if (Array.isArray(value)) {
            type = 'array';
        } else if (value !== null && typeof value === 'object') {
            type = 'object';
        }

        columns.push({ name: key, type });
    }

    return { columns, rows: items };
}

/**
 * Renders a cell based on its type
 */
function renderCell(value: any, type: 'primitive' | 'array' | 'object'): React.ReactNode {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return <span className="text-muted-foreground italic">null</span>;
    }

    // Primitive value
    if (type === 'primitive') {
        return <span>{String(value)}</span>;
    }

    // Array value
    if (type === 'array' && Array.isArray(value)) {
        // Empty array
        if (value.length === 0) {
            return <span className="text-muted-foreground italic">[]</span>;
        }

        // Check if it's a primitive array
        const isPrimitiveArray = value.every(
            item => item === null || typeof item !== 'object'
        );

        if (isPrimitiveArray) {
            // Render as comma-separated
            return <span>{value.join(', ')}</span>;
        }

        // Object array - render as nested table
        return renderNestedTable(value);
    }

    // Object value - render as nested table with single row
    if (type === 'object') {
        return renderNestedTable([value]);
    }

    return <span>{String(value)}</span>;
}

/**
 * Renders a nested table inside a cell
 */
function renderNestedTable(items: any[]): React.ReactNode {
    if (items.length === 0) return null;

    // Get headers from first item
    const headers = Object.keys(items[0]);

    return (
        <table className="w-full border-collapse nested-table">
            <thead>
                <tr>
                    {headers.map((header, idx) => (
                        <th
                            key={idx}
                            className="px-2 py-1 text-xs font-semibold bg-muted/50 border border-border/50"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {items.map((item, rowIdx) => (
                    <tr key={rowIdx}>
                        {headers.map((header, colIdx) => {
                            const cellValue = item[header];
                            const isNested = Array.isArray(cellValue) ||
                                (cellValue !== null && typeof cellValue === 'object');

                            return (
                                <td
                                    key={colIdx}
                                    className="px-2 py-1 text-xs border border-border/50"
                                >
                                    {isNested ? (
                                        renderCell(cellValue, Array.isArray(cellValue) ? 'array' : 'object')
                                    ) : cellValue === null ? (
                                        <span className="text-muted-foreground italic">null</span>
                                    ) : (
                                        String(cellValue)
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
