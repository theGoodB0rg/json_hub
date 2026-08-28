'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Download, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    jsonString: string;
    fileName: string;
    converterHref: string;
    platform: string;
}

export function TestDataActions({ jsonString, fileName, converterHref, platform }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleDownload = () => {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSeedAndOpen = () => {
        try {
            sessionStorage.setItem('jsonexport_seed_payload', jsonString);
        } catch {
            // ignore
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs h-8 gap-1.5 font-medium"
            >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy JSON'}
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs h-8 gap-1.5 font-medium"
            >
                <Download className="h-3.5 w-3.5" />
                Download .json
            </Button>

            <Link
                href={converterHref}
                onClick={handleSeedAndOpen}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-all shadow-sm"
            >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Convert {platform} to Excel Online &rarr;
            </Link>
        </div>
    );
}
