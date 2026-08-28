'use client';

import React, { useState, useMemo } from 'react';
import { ConverterPageConfig } from '@/lib/platform-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { ArrowRight, Check, Copy, FileCode2, Table2 } from 'lucide-react';
import { useAppStore } from '@/lib/store/store';
import { getPlatformSample } from '@/lib/converters/platform-samples';
import { flattenJSON } from '@/lib/parsers/flattener';

interface Props {
    pageConfig: ConverterPageConfig;
}

export function DemoPreview({ pageConfig }: Props) {
    const [copied, setCopied] = useState(false);
    const { setRawInput, parseInput } = useAppStore();

    // Load authentic platform sample
    const platformSample = useMemo(() => {
        return getPlatformSample(pageConfig.platformName);
    }, [pageConfig.platformName]);

    const sampleSnippet = platformSample.sampleJson;

    // Dynamically flatten the authentic sample data for the preview table
    const previewData = useMemo(() => {
        try {
            const parsed = JSON.parse(sampleSnippet);
            const { rows, schema } = flattenJSON(parsed);
            return {
                columns: schema.slice(0, 6), // Top 6 columns for clean display
                rows: rows.slice(0, 4), // First 4 rows
            };
        } catch {
            return {
                columns: ['id', 'name', 'status'],
                rows: [{ id: '1', name: 'Sample', status: 'active' }],
            };
        }
    }, [sampleSnippet]);

    const handleCopy = () => {
        navigator.clipboard.writeText(sampleSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLoadIntoEditor = () => {
        setRawInput(sampleSnippet);
        setTimeout(() => parseInput(), 100);
        window.scrollTo({ top: 100, behavior: 'smooth' });
    };

    return (
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                    <BrandIcon platform={pageConfig.platformName} className="w-4 h-4" />
                    <span>Live Transformation Architecture</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                    How JsonExport Flattens {pageConfig.platformName} Data
                </h3>
                <p className="text-muted-foreground text-sm max-w-2xl mx-auto mt-2">
                    {platformSample.description}. Nested objects and complex arrays are unpacked into clean spreadsheet columns automatically.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BEFORE: Raw Authentic Platform JSON */}
                <Card className="p-5 bg-card/80 border border-border/50 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <FileCode2 className="w-4 h-4 text-amber-500" />
                            <span>Before: Raw {pageConfig.platformName} Nested JSON</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? "Copied" : "Copy Sample"}</span>
                        </Button>
                    </div>
                    <div className="flex-1 bg-muted/40 rounded-lg p-3 font-mono text-xs overflow-x-auto border border-border/30 text-foreground/90 max-h-72">
                        <pre className="leading-relaxed"><code>{sampleSnippet}</code></pre>
                    </div>
                </Card>

                {/* AFTER: Flattened Excel / CSV Structure */}
                <Card className="p-5 bg-card/80 border border-border/50 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            <Table2 className="w-4 h-4 text-emerald-500" />
                            <span>After: Flattened Excel (.xlsx) Columns</span>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Clean Dot-Notation Columns
                        </span>
                    </div>

                    <div className="flex-1 overflow-x-auto border border-border/30 rounded-lg max-h-72 bg-background/50">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/60 border-b border-border/40 text-muted-foreground">
                                    {previewData.columns.map((col) => (
                                        <th key={col} className="p-2.5 font-semibold whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20 font-mono">
                                {previewData.rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        {previewData.columns.map((col) => {
                                            const val = row[col];
                                            const displayVal = val === null || val === undefined ? '—' : String(val);
                                            return (
                                                <td key={col} className="p-2.5 whitespace-nowrap text-foreground/85">
                                                    {displayVal}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-4 mt-auto flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Zero [object Object] errors</span>
                        <Button
                            size="sm"
                            onClick={handleLoadIntoEditor}
                            className="text-xs gap-1.5"
                        >
                            <span>Try With This Sample</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
