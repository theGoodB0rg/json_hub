'use client';

import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LargeFileViewerProps {
    content: string;
    fileName?: string;
    fileSize?: number;
}

const ROW_HEIGHT = 21; // px, matches LightJsonEditor line height

export function LargeFileViewer({ content, fileName, fileSize }: LargeFileViewerProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    // Process content into virtual lines
    const virtualLines = useMemo(() => {
        if (!content) return [];

        // Check for minification (heuristic: huge content but few newlines)
        const newlineCount = (content.match(/\n/g) || []).length;
        const isMinified = content.length > 50000 && newlineCount < content.length / 500; // e.g. avg line len > 500 chars

        if (isMinified) {
            // Chunk by 100 chars for display
            const chunks = [];
            for (let i = 0; i < content.length; i += 100) {
                chunks.push(content.slice(i, i + 100));
            }
            return chunks;
        }

        return content.split('\n');
    }, [content]);

    // Virtualizer
    const rowVirtualizer = useVirtualizer({
        count: virtualLines.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-[21px]">
            {/* Info Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-500 text-xs">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                        Read-Only View {fileName ? `- ${fileName}` : ''} {formatSize(fileSize)}
                    </span>
                </div>
                <div>{virtualLines.length.toLocaleString()} lines (Virtualized)</div>
            </div>

            {/* Virtualized List */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto relative custom-scrollbar"
                style={{ contain: 'strict' }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const lineContent = virtualLines[virtualRow.index];
                        const lineNum = virtualRow.index + 1;

                        return (
                            <div
                                key={virtualRow.key}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    display: 'flex',
                                }}
                                className="hover:bg-[#2a2a2a] transition-colors"
                            >
                                {/* Line Number */}
                                <div className="w-14 text-right pr-3 text-[#858585] select-none bg-[#1e1e1e] border-r border-[#3c3c3c] flex-shrink-0">
                                    {lineNum}
                                </div>
                                {/* Content */}
                                <div className="pl-4 whitespace-pre font-mono truncate">
                                    {lineContent}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
