'use client';

import { InlineEdit } from './InlineEdit';
import { useAppStore } from '@/lib/store/store';

/**
 * NestedTable - Hierarchical JSON visualization component
 * Recursively renders JSON as nested tables similar to jsontotable.org
 */

interface NestedTableProps {
    data: any;
    depth?: number;
    path?: string;
}

function isPrimitive(value: any): boolean {
    return value === null || typeof value !== 'object';
}

export function NestedTable({ data, depth = 0, path = '' }: NestedTableProps) {
    const { updateData, excludedColumns } = useAppStore();

    // Helper to check if a key should be excluded
    // For nested paths, check if any part of the path matches excludedColumns
    const isColumnExcluded = (key: string, currentPath: string): boolean => {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;
        // Check exact match and also top-level key match
        return excludedColumns.includes(key) ||
            excludedColumns.includes(fullPath) ||
            excludedColumns.some(col => col.endsWith(`.${key}`));
    };

    // Base case: primitive values
    if (isPrimitive(data)) {
        return <InlineEdit value={data} onSave={(val) => updateData(path, val)} />;
    }

    // Array: render as indexed rows
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return <span className="text-muted-foreground italic">[]</span>;
        }

        return (
            <table className="nested-table">
                <tbody>
                    {data.map((item, index) => {
                        const currentPath = path ? `${path}.${index}` : `${index}`;
                        return (
                            <tr key={index}>
                                <td className="index-cell">{index}</td>
                                <td>
                                    <NestedTable data={item} depth={depth + 1} path={currentPath} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }

    // Object: render as key-value table with excluded columns filtered out
    const entries = Object.entries(data).filter(([key]) => !isColumnExcluded(key, path));

    if (entries.length === 0) {
        return <span className="text-muted-foreground italic">{'{}'}</span>;
    }

    return (
        <table className="nested-table">
            <tbody>
                {entries.map(([key, value]) => {
                    const currentPath = path ? `${path}.${key}` : key;
                    return (
                        <tr key={key}>
                            <td className="key-cell" title={key}>
                                <div className="truncate max-w-[200px]">{key}</div>
                            </td>
                            <td className="value-cell">
                                <NestedTable data={value} depth={depth + 1} path={currentPath} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
