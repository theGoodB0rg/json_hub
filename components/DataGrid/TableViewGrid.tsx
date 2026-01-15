import { useMemo } from 'react';
import { InlineEdit } from './InlineEdit';
import { useAppStore } from '@/lib/store/store';

interface TableViewGridProps {
    data: any;
    basePath?: string; // Path to this data chunk in the global store
}

export function TableViewGrid({ data, basePath = '' }: TableViewGridProps) {
    const { updateData, excludedColumns } = useAppStore();
    const tableStructure = useMemo(() => analyzeStructure(data), [data]);

    // Filter out excluded columns
    const filteredColumns = useMemo(() => {
        if (!tableStructure) return [];
        return tableStructure.columns.filter(col => !excludedColumns.includes(col.name));
    }, [tableStructure, excludedColumns]);

    if (!tableStructure) {
        return (
            <div className="p-4 text-muted-foreground">
                No data to display
            </div>
        );
    }

    return (
        <div className="overflow-auto custom-scrollbar">
            {/* ... table rendering ... */}
            <table className="w-full text-sm border-collapse">
                <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                        {filteredColumns.map((col, idx) => (
                            <th
                                key={idx}
                                className="px-3 py-2 text-left font-semibold border border-border resize-x overflow-hidden"
                            >
                                {col.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableStructure.rows.map((row: any, rowIdx: number) => {
                        // Determine path for this row
                        // If data is array, path is basePath.rowIdx
                        // If wrapped object, it might vary, but analyzeStructure standardizes to array
                        const rowPath = basePath
                            ? `${basePath}.${rowIdx}`
                            : `${rowIdx}`;

                        return (
                            <tr key={rowIdx} className="hover:bg-muted/50 transition-colors">
                                {filteredColumns.map((col: any, colIdx: number) => {
                                    const cellData = row[col.name];
                                    const cellPath = `${rowPath}.${col.name}`;

                                    return (
                                        <td
                                            key={colIdx}
                                            className="px-3 py-2 border border-border align-top"
                                        >
                                            {renderCell(cellData, col.type, cellPath, updateData)}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ... analyzeStructure ...
function analyzeStructure(data: any) {
    if (!data) return null;
    const items = Array.isArray(data) ? data : [data];
    if (items.length === 0) return null;

    // ... same analysis ...
    const firstItem = items[0];
    const columns: Array<{ name: string; type: 'primitive' | 'array' | 'object' }> = [];

    for (const [key, value] of Object.entries(firstItem)) {
        let type: 'primitive' | 'array' | 'object' = 'primitive';
        if (Array.isArray(value)) type = 'array';
        else if (value !== null && typeof value === 'object') type = 'object';
        columns.push({ name: key, type });
    }
    return { columns, rows: items };
}

function renderCell(
    value: any,
    type: 'primitive' | 'array' | 'object',
    path: string,
    onUpdate: (path: string, val: any) => void
): React.ReactNode {
    if (value === null || value === undefined) {
        return <InlineEdit value={value} onSave={(val) => onUpdate(path, val)} />;
    }

    if (type === 'primitive') {
        return <InlineEdit value={value} onSave={(val) => onUpdate(path, val)} />;
    }

    if (type === 'array' && Array.isArray(value)) {
        if (value.length === 0) return <span className="text-muted-foreground italic">[]</span>;

        const isPrimitiveArray = value.every(item => item === null || typeof item !== 'object');
        if (isPrimitiveArray) {
            // For primitive arrays, we might edit the whole string or individual items?
            // Simplest is to treat as read-only or string edit for now, 
            // but let's try to map it. 
            // EDIT: primitive array like [1, 2] -> let's just make it editable as text for now
            // Or recursively render? "renderNestedTable" handles it.
            return <span>{value.join(', ')}</span>; // TODO: Make primitive arrays editable
        }
        return renderNestedTable(value, path, onUpdate);
    }

    if (type === 'object') {
        return renderNestedTable([value], path, onUpdate, true); // Wrap object in array, flag as wrapper
    }

    return <span>{String(value)}</span>;
}

function renderNestedTable(
    items: any[],
    basePath: string,
    onUpdate: (p: string, v: any) => void,
    isObjectWrapper: boolean = false // Default to false (array mode)
): React.ReactNode {
    if (items.length === 0) return null;
    const headers = Object.keys(items[0]);

    return (
        <table className="w-full border-collapse nested-table my-1">
            <thead>
                <tr>
                    {headers.map((header, idx) => (
                        <th key={idx} className="px-2 py-1 text-xs font-semibold bg-muted/50 border border-border/50">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {items.map((item, rowIdx) => {
                    // FIX: If this is an object wrapper (array of 1 synthetic item), 
                    // the path is just 'basePath', not 'basePath.0'.
                    const rowPath = isObjectWrapper ? basePath : `${basePath}.${rowIdx}`;

                    return (
                        <tr key={rowIdx}>
                            {headers.map((header, colIdx) => {
                                const cellValue = item[header];
                                // Accessing property: path.header
                                const cellPath = `${rowPath}.${header}`;

                                return (
                                    <td key={colIdx} className="px-2 py-1 text-xs border border-border/50">
                                        {/* Pass recursive calls without wrapper flag unless it's another object */}
                                        {renderCell(cellValue, Array.isArray(cellValue) ? 'array' : (cellValue !== null && typeof cellValue === 'object') ? 'object' : 'primitive', cellPath, onUpdate)}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
