'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store/store';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, Code2, Sparkles } from 'lucide-react';

export function CodeOutputViewer() {
    const { formattedOutput, parsedData, exportData, isLoading } = useAppStore();
    const [copied, setCopied] = useState(false);

    const displayCode = formattedOutput || (parsedData ? JSON.stringify(parsedData, null, 2) : '');

    const handleCopy = async () => {
        if (!displayCode) return;
        try {
            await navigator.clipboard.writeText(displayCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code to clipboard', err);
        }
    };

    const handleDownload = () => {
        exportData('json');
    };

    if (!displayCode && !isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3">
                <Code2 className="w-12 h-12 stroke-[1.5] text-muted-foreground/60" />
                <p className="text-sm font-medium">Ready to transform your data.</p>
                <p className="text-xs max-w-sm">Paste your input data on the left to see instant, formatted JSON output.</p>
            </div>
        );
    }

    const lines = displayCode.split('\n');
    const lineCount = lines.length;
    const byteSize = (new Blob([displayCode]).size / 1024).toFixed(1);

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] rounded-lg overflow-hidden border border-border/40 font-mono text-sm text-[#d4d4d4]">
            {/* Header Controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] text-xs">
                <div className="flex items-center gap-3">
                    <span className="text-[#858585]">{lineCount} lines</span>
                    <span className="text-[#858585]">{byteSize} KB</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-medium text-[11px]">
                        <Sparkles className="w-3 h-3" /> Valid JSON
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCopy}
                        className="h-7 text-xs gap-1.5 bg-[#333333] hover:bg-[#444444] text-white border-0"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy JSON'}
                    </Button>
                    <Button
                        size="sm"
                        variant="default"
                        onClick={handleDownload}
                        className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download .json
                    </Button>
                </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto p-4 leading-[21px] select-text">
                <pre className="m-0 font-mono text-xs md:text-sm text-[#9cdcfe]">
                    <code>{displayCode}</code>
                </pre>
            </div>
        </div>
    );
}
