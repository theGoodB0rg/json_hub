'use client';

import { useState, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { InlineEdit } from './InlineEdit';
import { useAppStore } from '@/lib/store/store';
import { ChevronRight, ChevronDown } from 'lucide-react';

/**
 * NestedTable - Hierarchical JSON visualization component
 * Recursively renders JSON as nested tables with virtualization
 * and lazy loading for performance on large datasets
 */

const MAX_AUTO_EXPAND_DEPTH = 3;
const MAX_AUTO_EXPAND_ITEMS = 100;
const ROW_HEIGHT = 32;

interface NestedTableProps {
    data: any;
    depth?: number;
    path?: string;
    maxDepth?: number;
}

function isPrimitive(value: any): boolean {
    return value === null || typeof value !== 'object';
}

export function NestedTable({
    data,
    depth = 0,
    path = '',
    maxDepth = MAX_AUTO_EXPAND_DEPTH
}: NestedTableProps) {
    const { updateData, excludedColumns } = useAppStore();
    const [isExpanded, setIsExpanded] = useState(depth < maxDepth);
    const containerRef = useRef<HTMLDivElement>(null);

    // Helper to check if a key should be excluded
    const isColumnExcluded = (key: string, currentPath: string): boolean => {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;
        return excludedColumns.includes(key) ||
            excludedColumns.includes(fullPath) ||
            excludedColumns.some(col => col.endsWith(`.${key}`));
    };

    // Base case: primitive values
    if (isPrimitive(data)) {
        return <InlineEdit value={data} onSave={(val) => updateData(path, val)} />;
    }

    // If depth exceeds limit and not expanded, show expand button
    if (depth >= maxDepth && !isExpanded) {
        const itemCount = Array.isArray(data) ? data.length : Object.keys(data).length;
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
            >
                <ChevronRight className="h-3 w-3" />
                <span>{Array.isArray(data) ? `[${itemCount} items]` : `{${itemCount} keys}`}</span>
            </button>
        );
    }

    // Array: render as indexed rows
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return <span className="text-muted-foreground italic">[]</span>;
        }

        // For large arrays, use virtualization
        if (data.length > MAX_AUTO_EXPAND_ITEMS) {
            return (
                <VirtualizedArrayTable
                    data={data}
                    path={path}
                    depth={depth}
                    maxDepth={maxDepth}
                    containerRef={containerRef}
                />
            );
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
                                    <NestedTable data={item} depth={depth + 1} path={currentPath} maxDepth={maxDepth} />
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

    // Show collapse button for expanded deep items
    const showCollapseButton = depth >= maxDepth && isExpanded;

    return (
        <div>
            {showCollapseButton && (
                <button
                    onClick={() => setIsExpanded(false)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
                >
                    <ChevronDown className="h-3 w-3" />
                    <span>Collapse</span>
                </button>
            )}
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
                                    <NestedTable data={value} depth={depth + 1} path={currentPath} maxDepth={maxDepth} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// Separate component for virtualized array rendering
function VirtualizedArrayTable({
    data,
    path,
    depth,
    maxDepth,
    containerRef
}: {
    data: any[];
    path: string;
    depth: number;
    maxDepth: number;
    containerRef: React.RefObject<HTMLDivElement>;
}) {
    const localContainerRef = useRef<HTMLDivElement>(null);
    const effectiveRef = containerRef.current ? containerRef : localContainerRef;

    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => effectiveRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
    });

    return (
        <div
            ref={localContainerRef}
            className="max-h-[300px] overflow-auto border rounded custom-scrollbar"
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const index = virtualRow.index;
                    const item = data[index];
                    const currentPath = path ? `${path}.${index}` : `${index}`;

                    return (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <table className="nested-table w-full">
                                <tbody>
                                    <tr>
                                        <td className="index-cell flex-shrink-0 w-12 align-top">{index}</td>
                                        <td className="flex-1">
                                            <NestedTable data={item} depth={depth + 1} path={currentPath} maxDepth={maxDepth} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
