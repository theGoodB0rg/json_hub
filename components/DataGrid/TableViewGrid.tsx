'use client';

import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { InlineEdit } from './InlineEdit';
import { useAppStore } from '@/lib/store/store';
import { smartUnwrap } from '@/lib/parsers/unwrapper';

const ROW_HEIGHT = 40;

interface TableViewGridProps {
    data: any;
    basePath?: string;
}

export function TableViewGrid({ data, basePath = '' }: TableViewGridProps) {
    const { updateData, excludedColumns } = useAppStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Smart Unwrap: Ensure we display the core records, not the envelope (e.g. Salesforce totalSize)
    const tableStructure = useMemo(() => {
        const { data: unwrappedData } = smartUnwrap(data);
        return analyzeStructure(unwrappedData);
    }, [data]);

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
    const HEADER_HEIGHT = 40; // Height of header row

    return (
        <div
            ref={containerRef}
            className="overflow-auto custom-scrollbar h-full w-full border border-border rounded-md bg-background"
        >
            {/* Header Row - Sticky */}
            <div
                className="sticky top-0 z-10 flex bg-muted border-b border-border"
                style={{ minWidth: `${filteredColumns.length * 150}px` }}
            >
                {filteredColumns.map((col, idx) => (
                    <div
                        key={idx}
                        className="min-w-[150px] w-[150px] flex-shrink-0 px-3 py-2 text-left font-semibold text-sm border-r border-border last:border-r-0 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                        {col.name}
                    </div>
                ))}
            </div>

            {/* Virtual rows container */}
            <div
                style={{
                    height: `${totalHeight}px`,
                    minWidth: `${filteredColumns.length * 150}px`,
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = tableStructure.rows[virtualRow.index];
                    const rowIdx = virtualRow.index;
                    const rowPath = basePath
                        ? `${basePath}.${rowIdx}`
                        : `${rowIdx}`;

                    return (
                        <div
                            key={rowIdx}
                            className="absolute top-0 left-0 flex hover:bg-muted/50 transition-colors border-b border-border/50"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                                minWidth: `${filteredColumns.length * 150}px`,
                            }}
                        >
                            {filteredColumns.map((col: any, colIdx: number) => {
                                const cellData = row[col.name];
                                const cellPath = `${rowPath}.${col.name}`;

                                return (
                                    <div
                                        key={colIdx}
                                        className="min-w-[150px] w-[150px] flex-shrink-0 px-3 py-2 text-sm border-r border-border/50 last:border-r-0 overflow-hidden flex items-center"
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

    // Unwrap wrapper patterns:
    // 1. { products: [...] } - object with single key containing array
    // 2. [{ products: [...] }] - array with single element that is a wrapper object
    let effectiveData = data;

    // Case 1: Direct wrapper object { products: [...] }
    if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        if (keys.length === 1 && Array.isArray(data[keys[0]])) {
            effectiveData = data[keys[0]];
        }
    }
    // Case 2: Array with single wrapper object [{ products: [...] }]
    else if (Array.isArray(data) && data.length === 1) {
        const firstElement = data[0];
        if (typeof firstElement === 'object' && firstElement !== null && !Array.isArray(firstElement)) {
            const keys = Object.keys(firstElement);
            if (keys.length === 1 && Array.isArray(firstElement[keys[0]])) {
                effectiveData = firstElement[keys[0]];
            }
        }
    }

    const items = Array.isArray(effectiveData) ? effectiveData : [effectiveData];
    if (items.length === 0) return null;

    const firstItem = items[0];
    if (!firstItem || typeof firstItem !== 'object') return null;

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
