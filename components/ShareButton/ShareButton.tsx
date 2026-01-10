'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store/store';
import { createShareableLink, copyToClipboard } from '@/lib/utils/shareLink';

export function ShareButton() {
    const { rawInput } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleShare = () => {
        setError(null);
        setCopied(false);

        if (!rawInput || rawInput.trim() === '') {
            setError('No JSON data to share. Please paste or upload JSON first.');
            return;
        }

        const url = createShareableLink(rawInput);

        if (!url) {
            setError('JSON data is too large to share via URL (max 2KB compressed). Try sharing smaller datasets.');
            return;
        }

        setShareUrl(url);
    };

    const handleCopy = async () => {
        if (!shareUrl) return;

        const success = await copyToClipboard(shareUrl);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            setError('Failed to copy to clipboard. Please copy manually.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleShare}
                >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share JSON Conversion</DialogTitle>
                    <DialogDescription>
                        Share this link with your team. The JSON data is embedded in the URL (no server upload).
                    </DialogDescription>
                </DialogHeader>

                {error ? (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive rounded-md">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                ) : shareUrl ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                                onClick={(e) => e.currentTarget.select()}
                            />
                            <Button
                                onClick={handleCopy}
                                size="sm"
                                variant={copied ? 'default' : 'secondary'}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Copied!
                                    </>
                                ) : (
                                    'Copy'
                                )}
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>✓ Data is compressed and embedded in the URL</p>
                            <p>✓ No server storage - 100% private</p>
                            <p>✓ Anyone with this link can view and convert the JSON</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        Click the button above to generate a shareable link.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
