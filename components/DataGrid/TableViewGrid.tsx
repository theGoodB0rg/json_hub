'use client';

import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { InlineEdit } from './InlineEdit';
import { useAppStore } from '@/lib/store/store';
import { smartUnwrap } from '@/lib/parsers/unwrapper';

const ROW_HEIGHT = 44;
const EXPANDED_ROW_HEIGHT = 240; // Height when a cell is expanded

interface TableViewGridProps {
    data: any;
    basePath?: string;
}

interface ColumnDef {
    name: string;
    type: 'primitive' | 'array' | 'object';
    width: number;
}

export function TableViewGrid({ data, basePath = '' }: TableViewGridProps) {
    const { updateData, excludedColumns } = useAppStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

    // Smart Unwrap: Ensure we display the core records, not the envelope
    const tableStructure = useMemo(() => {
        const { data: unwrappedData } = smartUnwrap(data);
        return analyzeStructure(unwrappedData);
    }, [data]);

    // Filter out excluded columns and calculate widths
    const filteredColumns = useMemo(() => {
        if (!tableStructure) return [];
        return tableStructure.columns
            .filter(col => !excludedColumns.includes(col.name))
            .map(col => ({
                ...col,
                width: calculateColumnWidth(col, tableStructure.rows)
            }));
    }, [tableStructure, excludedColumns]);

    const totalWidth = useMemo(() => {
        return filteredColumns.reduce((sum, col) => sum + col.width, 0);
    }, [filteredColumns]);

    // Check if a row has any expanded cells
    const getRowHeight = (rowIdx: number) => {
        // Check if any cell in this row is expanded
        for (const col of filteredColumns) {
            if (expandedCells.has(`${rowIdx}-${col.name}`)) {
                return EXPANDED_ROW_HEIGHT;
            }
        }
        return ROW_HEIGHT;
    };

    // Row virtualizer for performance with large datasets
    const rowVirtualizer = useVirtualizer({
        count: tableStructure?.rows.length ?? 0,
        getScrollElement: () => containerRef.current,
        estimateSize: (idx) => getRowHeight(idx),
        overscan: 5,
    });

    const toggleExpand = (cellId: string, rowIdx: number) => {
        setExpandedCells(prev => {
            const next = new Set(prev);
            if (next.has(cellId)) {
                next.delete(cellId);
            } else {
                next.add(cellId);
            }
            return next;
        });
        // Force virtualizer to recalculate the row size
        rowVirtualizer.resizeItem(rowIdx, expandedCells.has(cellId) ? ROW_HEIGHT : EXPANDED_ROW_HEIGHT);
    };

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
            {/* Header Row - Sticky */}
            <div
                className="sticky top-0 z-10 flex bg-muted border-b border-border"
                style={{ minWidth: `${totalWidth}px` }}
            >
                {filteredColumns.map((col, idx) => (
                    <div
                        key={idx}
                        className="flex-shrink-0 px-3 py-2.5 text-left font-semibold text-sm border-r border-border last:border-r-0 overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                        title={col.name}
                    >
                        <span className="flex items-center gap-1.5">
                            {col.name}
                            {col.type === 'object' && (
                                <span className="text-[10px] text-muted-foreground bg-muted-foreground/10 px-1 rounded">obj</span>
                            )}
                            {col.type === 'array' && (
                                <span className="text-[10px] text-muted-foreground bg-muted-foreground/10 px-1 rounded">[]</span>
                            )}
                        </span>
                    </div>
                ))}
            </div>

            {/* Virtual rows container */}
            <div
                style={{
                    height: `${totalHeight}px`,
                    minWidth: `${totalWidth}px`,
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = tableStructure.rows[virtualRow.index];
                    const rowIdx = virtualRow.index;
                    const rowPath = basePath ? `${basePath}.${rowIdx}` : `${rowIdx}`;

                    return (
                        <div
                            key={rowIdx}
                            className="absolute top-0 left-0 flex hover:bg-muted/50 transition-colors border-b border-border/50 items-start"
                            style={{
                                minHeight: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                                minWidth: `${totalWidth}px`,
                            }}
                        >
                            {filteredColumns.map((col, colIdx) => {
                                const cellData = row[col.name];
                                const cellPath = `${rowPath}.${col.name}`;
                                const cellId = `${rowIdx}-${col.name}`;
                                const isExpanded = expandedCells.has(cellId);

                                return (
                                    <div
                                        key={colIdx}
                                        className="flex-shrink-0 px-3 py-2 text-sm border-r border-border/50 last:border-r-0 overflow-visible"
                                        style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                                    >
                                        <div className="w-full">
                                            {renderCell(cellData, col.type, cellPath, updateData, isExpanded, () => toggleExpand(cellId, rowIdx))}
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

// Calculate dynamic column width based on content
function calculateColumnWidth(col: { name: string; type: 'primitive' | 'array' | 'object' }, rows: any[]): number {
    const MIN_WIDTH = 100;
    const MAX_WIDTH = 280;

    // Base width on column name length
    let width = Math.max(MIN_WIDTH, col.name.length * 10 + 40);

    // Adjust based on type
    if (col.type === 'object') {
        width = Math.max(width, 180); // Objects need more space for preview
    } else if (col.type === 'array') {
        width = Math.max(width, 140); // Arrays show count + preview
    } else {
        // Sample first few rows to estimate content width
        const sampleSize = Math.min(5, rows.length);
        for (let i = 0; i < sampleSize; i++) {
            const value = rows[i]?.[col.name];
            if (value !== null && value !== undefined) {
                const strLen = String(value).length;
                width = Math.max(width, Math.min(strLen * 8 + 24, MAX_WIDTH));
            }
        }
    }

    return Math.min(width, MAX_WIDTH);
}

function analyzeStructure(data: any) {
    if (!data) return null;

    // Unwrap wrapper patterns
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
    onUpdate: (path: string, val: any) => void,
    isExpanded: boolean,
    onToggleExpand: () => void
): React.ReactNode {
    if (value === null) {
        return <span className="text-muted-foreground/60 italic">null</span>;
    }
    if (value === undefined) {
        return <span className="text-muted-foreground/60 italic">—</span>;
    }

    if (type === 'primitive') {
        return <InlineEdit value={value} onSave={(val) => onUpdate(path, val)} />;
    }

    if (type === 'array' && Array.isArray(value)) {
        if (value.length === 0) {
            return <span className="text-muted-foreground italic text-xs">empty array</span>;
        }

        const isPrimitiveArray = value.every(item => item === null || typeof item !== 'object');

        if (isPrimitiveArray) {
            // Show primitive arrays inline
            const preview = value.slice(0, 3).join(', ');
            const suffix = value.length > 3 ? `, +${value.length - 3} more` : '';
            return (
                <span className="text-sm" title={value.join(', ')}>
                    [{preview}{suffix}]
                </span>
            );
        }

        // For object arrays, show count with expandable preview
        return (
            <div className="w-full">
                <button
                    onClick={onToggleExpand}
                    className="inline-flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors"
                    title={`${value.length} items - click to ${isExpanded ? 'collapse' : 'expand'}`}
                >
                    <span className="font-medium">{value.length} items</span>
                    <svg
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Expanded view - show mini table */}
                {isExpanded && (
                    <div className="mt-2 max-h-48 overflow-auto border border-border/50 rounded bg-background shadow-sm">
                        <table className="w-full text-xs">
                            <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                    {Object.keys(value[0] || {}).map((header, idx) => (
                                        <th key={idx} className="px-2 py-1 text-left font-semibold border-b border-border/50 whitespace-nowrap">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {value.map((item, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-muted/30">
                                        {Object.entries(item || {}).map(([key, val], colIdx) => (
                                            <td key={colIdx} className="px-2 py-1 border-b border-border/30 whitespace-nowrap">
                                                {val === null ? (
                                                    <span className="text-muted-foreground/60 italic">null</span>
                                                ) : typeof val === 'object' ? (
                                                    <span className="text-muted-foreground">{JSON.stringify(val).slice(0, 30)}...</span>
                                                ) : (
                                                    String(val)
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    if (type === 'object') {
        // Show compact object preview
        const keys = Object.keys(value);
        const previewParts: string[] = [];

        // Show first 2-3 key-value pairs
        for (let i = 0; i < Math.min(2, keys.length); i++) {
            const k = keys[i];
            const v = value[k];
            if (v !== null && typeof v !== 'object') {
                previewParts.push(`${k}: ${String(v).slice(0, 15)}${String(v).length > 15 ? '…' : ''}`);
            } else if (v === null) {
                previewParts.push(`${k}: null`);
            } else {
                previewParts.push(`${k}: {...}`);
            }
        }

        const moreCount = keys.length - previewParts.length;
        const preview = previewParts.join(', ') + (moreCount > 0 ? `, +${moreCount}` : '');

        return (
            <span
                className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded font-mono truncate block"
                title={JSON.stringify(value, null, 2)}
            >
                {'{' + preview + '}'}
            </span>
        );
    }

    return <span>{String(value)}</span>;
}
