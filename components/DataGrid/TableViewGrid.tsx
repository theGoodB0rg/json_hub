'use client';

import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { InlineEdit } from './InlineEdit';
import { useAppStore } from '@/lib/store/store';

const ROW_HEIGHT = 40;

interface TableViewGridProps {
    data: any;
    basePath?: string;
}

export function TableViewGrid({ data, basePath = '' }: TableViewGridProps) {
    const { updateData, excludedColumns } = useAppStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const tableStructure = useMemo(() => analyzeStructure(data), [data]);

    // Filter out excluded columns
    const filteredColumns = useMemo(() => {
        if (!tableStructure) return [];
        return tableStructure.columns.filter(col => !excludedColumns.includes(col.name));
    }, [tableStructure, excludedColumns]);

    // Row virtualizer for performance with large datasets
    const rowVirtualizer = useVirtualizer({
        count: tableStructure?.rows.length ?? 0,
        getScrollElement: () => containerRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
    });

    if (!tableStructure) {
        return (
            <div className="p-4 text-muted-foreground">
                No data to display
            </div>
        );
    }

    const totalHeight = rowVirtualizer.getTotalSize();

    return (
        <div
            ref={containerRef}
            className="overflow-auto custom-scrollbar h-full w-full border border-border rounded-md bg-background"
        >
            <div
                style={{
                    height: `${totalHeight}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {/* Header Row - Sticky */}
                <div
                    className="sticky top-0 z-10 flex bg-muted border-b border-border"
                    style={{
                        width: '100%',
                        position: 'sticky',
                        top: 0
                    }}
                >
                    {filteredColumns.map((col, idx) => (
                        <div
                            key={idx}
                            className="flex-1 min-w-[150px] px-3 py-2 text-left font-semibold text-sm border-r border-border last:border-r-0 overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                            {col.name}
                        </div>
                    ))}
                </div>

                {/* Virtual rows */}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = tableStructure.rows[virtualRow.index];
                    const rowIdx = virtualRow.index;
                    const rowPath = basePath
                        ? `${basePath}.${rowIdx}`
                        : `${rowIdx}`;

                    // Adjust translateY to account for header height (assuming ~37px for header)
                    // Actually, if header is *inside* the scroll container, we don't need to offset,
                    // BUT because we're using absolute positioning relative to the container,
                    // we need to make sure the header doesn't overlap the first rows if they start at 0.
                    // The "sticky" header is part of the flow if using native tables, but with absolute divs...
                    // Better approach: Separate container for Header and Body?
                    // Or: Just offset the start position by header height?

                    // Let's try separate Header outside the virtual container for simplicity.
                    return (
                        <div
                            key={rowIdx}
                            className="absolute top-0 left-0 w-full flex hover:bg-muted/50 transition-colors border-b border-border/50"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            {filteredColumns.map((col: any, colIdx: number) => {
                                const cellData = row[col.name];
                                const cellPath = `${rowPath}.${col.name}`;

                                return (
                                    <div
                                        key={colIdx}
                                        className="flex-1 min-w-[150px] px-3 py-2 text-sm border-r border-border/50 last:border-r-0 overflow-hidden flex items-center"
                                    >
                                        <div className="w-full truncate">
                                            {renderCell(cellData, col.type, cellPath, updateData)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function analyzeStructure(data: any) {
    if (!data) return null;
    const items = Array.isArray(data) ? data : [data];
    if (items.length === 0) return null;

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
            return <span>{value.join(', ')}</span>;
        }
        return renderNestedTable(value, path, onUpdate);
    }

    if (type === 'object') {
        return renderNestedTable([value], path, onUpdate, true);
    }

    return <span>{String(value)}</span>;
}

function renderNestedTable(
    items: any[],
    basePath: string,
    onUpdate: (p: string, v: any) => void,
    isObjectWrapper: boolean = false
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
                    const rowPath = isObjectWrapper ? basePath : `${basePath}.${rowIdx}`;

                    return (
                        <tr key={rowIdx}>
                            {headers.map((header, colIdx) => {
                                const cellValue = item[header];
                                const cellPath = `${rowPath}.${header}`;

                                return (
                                    <td key={colIdx} className="px-2 py-1 text-xs border border-border/50">
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
