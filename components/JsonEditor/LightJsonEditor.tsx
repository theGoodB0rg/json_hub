'use client';

import { forwardRef, useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

// Size thresholds
const LARGE_FILE_THRESHOLD = 500 * 1024; // 500KB - switch to preview mode
const STREAMING_THRESHOLD = 5 * 1024 * 1024; // 5MB - use streaming

interface ParseError {
    line?: number;
    column?: number;
    message: string;
}

interface LightJsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    parseErrors?: ParseError[];
    isLargeFile?: boolean;
    fileSize?: number;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
}

/**
 * Lightweight JSON editor that handles large files without freezing.
 * Features:
 * - Virtualized line rendering (only shows visible lines)
 * - Error line highlighting
 * - Large file mode (preview + parse button)
 */
export const LightJsonEditor = forwardRef<HTMLTextAreaElement, LightJsonEditorProps>(
    ({ value, onChange, parseErrors = [], isLargeFile, fileSize, placeholder, className, readOnly }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const lineNumbersRef = useRef<HTMLDivElement>(null);
        const [scrollTop, setScrollTop] = useState(0);

        // Calculate line info
        const lines = useMemo(() => value.split('\n'), [value]);
        const lineCount = lines.length;

        // Get error line number (first error)
        const errorLine = parseErrors.length > 0 ? parseErrors[0].line : null;

        // Virtualization settings
        const LINE_HEIGHT = 21; // px
        const VISIBLE_BUFFER = 10; // extra lines to render above/below

        // Calculate visible range
        const containerHeight = containerRef.current?.clientHeight || 400;
        const visibleLineCount = Math.ceil(containerHeight / LINE_HEIGHT) + VISIBLE_BUFFER * 2;
        const startLine = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - VISIBLE_BUFFER);
        const endLine = Math.min(lineCount, startLine + visibleLineCount);

        // Sync scroll between textarea and line numbers
        const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
            const target = e.target as HTMLTextAreaElement;
            setScrollTop(target.scrollTop);
            if (lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = target.scrollTop;
            }
        }, []);

        // Large file warning message
        const fileSizeDisplay = fileSize
            ? fileSize > 1024 * 1024
                ? `${(fileSize / (1024 * 1024)).toFixed(1)}MB`
                : `${(fileSize / 1024).toFixed(0)}KB`
            : null;

        return (
            <div className={cn("relative h-full w-full flex flex-col", className)}>
                {/* Large file warning */}
                {isLargeFile && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>
                            Large file detected{fileSizeDisplay ? ` (${fileSizeDisplay})` : ''} - Showing preview.
                            Full parsing will happen on export.
                        </span>
                    </div>
                )}

                {/* Error bar */}
                {parseErrors.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border-b border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>
                            {parseErrors[0].line && parseErrors[0].column
                                ? `Line ${parseErrors[0].line}, Column ${parseErrors[0].column}: `
                                : ''}
                            {parseErrors[0].message}
                        </span>
                    </div>
                )}

                {/* Editor area */}
                <div ref={containerRef} className="flex-1 relative overflow-hidden">
                    {/* Line numbers */}
                    <div
                        ref={lineNumbersRef}
                        className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-[#3c3c3c] overflow-hidden select-none pointer-events-none z-10"
                    >
                        <div
                            style={{
                                paddingTop: `${startLine * LINE_HEIGHT}px`,
                                height: `${lineCount * LINE_HEIGHT}px`,
                            }}
                        >
                            {Array.from({ length: endLine - startLine }, (_, i) => {
                                const lineNum = startLine + i + 1;
                                const isErrorLine = errorLine === lineNum;
                                return (
                                    <div
                                        key={lineNum}
                                        className={cn(
                                            "text-right pr-2 text-xs font-mono leading-[21px]",
                                            isErrorLine
                                                ? "bg-red-500/30 text-red-400"
                                                : "text-[#858585]"
                                        )}
                                    >
                                        {lineNum}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main textarea */}
                    <textarea
                        ref={ref || textareaRef}
                        value={isLargeFile ? value.slice(0, 50000) + (value.length > 50000 ? '\n\n... (preview truncated for performance)' : '') : value}
                        onChange={(e) => !readOnly && onChange(e.target.value)}
                        onScroll={handleScroll}
                        readOnly={readOnly || isLargeFile}
                        placeholder={placeholder || 'Paste your JSON here or upload a file...'}
                        spellCheck={false}
                        className={cn(
                            "w-full h-full resize-none border-0 outline-none",
                            "bg-[#1e1e1e] text-[#d4d4d4]",
                            "font-mono text-sm leading-[21px]",
                            "pl-14 pr-4 py-3",
                            "placeholder:text-[#6e7681]",
                            "focus:ring-0 focus:outline-none",
                            isLargeFile && "cursor-default"
                        )}
                        style={{
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            tabSize: 2,
                        }}
                    />

                    {/* Error line highlight overlay */}
                    {errorLine && !isLargeFile && (
                        <div
                            className="absolute left-12 right-0 bg-red-500/10 pointer-events-none"
                            style={{
                                top: `${(errorLine - 1) * LINE_HEIGHT}px`,
                                height: `${LINE_HEIGHT}px`,
                            }}
                        />
                    )}
                </div>
            </div>
        );
    }
);

LightJsonEditor.displayName = 'LightJsonEditor';

// Utility to detect if file is large
export function isLargeFileSize(size: number): boolean {
    return size > LARGE_FILE_THRESHOLD;
}

export function needsStreaming(size: number): boolean {
    return size > STREAMING_THRESHOLD;
}
