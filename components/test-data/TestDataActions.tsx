'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Download, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

interface Props {
    jsonString: string;
    fileName: string;
    converterHref: string;
    platform: string;
}

export function TestDataActions({ jsonString, fileName, converterHref, platform }: Props) {
    const [copied, setCopied] = useState(false);

    // Every action on this page was previously untracked, which is why
    // "people take the dummy JSON and leave" could be argued but never
    // checked: /test-data is the second-busiest path on the site and had
    // emitted no event of any kind. `is_sample: true` keeps these out of the
    // genuine-upload conversion rate — nobody uploaded anything here.
    const track = (name: 'sample_copied' | 'sample_downloaded' | 'converter_bridge_clicked') => {
        trackConversionEvent(name, {
            platform,
            format: 'json',
            file_size_bytes: jsonString.length,
            is_sample: true,
        });
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            // Only on success: a clipboard the browser refused is not a copy.
            track('sample_copied');
        } catch {
            // fallback
        }
    };

    const handleDownload = () => {
        track('sample_downloaded');
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
        // Fired before the seed write so a storage failure still records the
        // intent — the click is the number we care about here.
        track('converter_bridge_clicked');
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
