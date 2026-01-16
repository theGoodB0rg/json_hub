'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, Zap, Server, Code } from 'lucide-react';

interface LargeFileUpsellProps {
    isOpen: boolean;
    onClose: () => void;
    onProceedAnyway: () => void;
    fileSize: number;
}

export function LargeFileUpsell({ isOpen, onClose, onProceedAnyway, fileSize }: LargeFileUpsellProps) {
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-5 w-5" />
                        Large File Detected ({fileSizeMB}MB)
                    </DialogTitle>
                    <DialogDescription>
                        Browser-based tools work best with files under 1MB. For larger files, we recommend these specialized tools:
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 my-4">
                    {/* Affiliate recommendations */}
                    <a
                        href="https://flatfile.com/?ref=jsonexport"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold flex items-center gap-1">
                                Flatfile <ExternalLink className="h-3 w-3" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Enterprise data import. Handles 100MB+ files with smart mapping.
                            </p>
                        </div>
                    </a>

                    <a
                        href="https://airtable.com/?ref=jsonexport"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold flex items-center gap-1">
                                Airtable <ExternalLink className="h-3 w-3" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Import JSON directly into spreadsheet database. Great for recurring imports.
                            </p>
                        </div>
                    </a>

                    <a
                        href="/blog/5-ways-convert-json-to-excel-ranked"
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <Code className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold">Python + Pandas (Free)</div>
                            <p className="text-sm text-muted-foreground">
                                For developers: handles unlimited file sizes. See our guide.
                            </p>
                        </div>
                    </a>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="secondary" onClick={onProceedAnyway}>
                        Try Anyway (May Freeze)
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                    JsonExport works best with API responses, webhook payloads, and small exports.
                </p>
            </DialogContent>
        </Dialog>
    );
}
