'use client';

import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BuyProLink } from '@/components/BuyProLink';
import { useAppStore } from '@/lib/store/store';
import { FREE_EXPORT_LIMIT_LABEL, FREE_SAMPLE_ROWS } from '@/lib/license/limits';
import { ROUTES } from '@/lib/routes';

const formatMb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

/**
 * The single paywall for the free tier. Opened by the store (`paywall` state)
 * when an export is over the free size, and by the batch button.
 *
 * Buying and activating reuse the existing Gumroad link and /activate page.
 * Activation in another tab reaches this one through the license restore in
 * ConverterApp, so the user can come back and export without reloading.
 */
export function ProPaywall() {
    const { paywall, setPaywall, sourceBytes, selectedFormat, exportData } = useAppStore();
    if (!paywall) return null;

    const close = () => setPaywall(null);
    const isLargeFile = paywall === 'large_file';

    return (
        <Dialog open onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isLargeFile
                            ? `Files over ${FREE_EXPORT_LIMIT_LABEL} export with Pro`
                            : 'Batch conversion is a Pro feature'}
                    </DialogTitle>
                    <DialogDescription className="space-y-2 pt-1 text-left">
                        {isLargeFile ? (
                            <span className="block">
                                This file is {formatMb(sourceBytes)}. Files up to {FREE_EXPORT_LIMIT_LABEL} convert
                                free, and you can preview any size. Pro exports the whole file, right here in your
                                browser.
                            </span>
                        ) : (
                            <span className="block">
                                Convert a whole folder of JSON files in one go, right here in your browser.
                            </span>
                        )}
                        <span className="block">
                            $29 once, lifetime. Also unlocks batch conversion and the desktop app for files of any
                            size. Nothing is uploaded, ever.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <Button asChild size="lg">
                        <BuyProLink source={`paywall_${paywall}`}>Get Pro — $29</BuyProLink>
                    </Button>
                    {isLargeFile && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                close();
                                void exportData(selectedFormat, { sampleRows: FREE_SAMPLE_ROWS });
                            }}
                        >
                            Download the first {FREE_SAMPLE_ROWS.toLocaleString()} rows free
                        </Button>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <p className="text-xs text-muted-foreground">
                        Already bought?{' '}
                        <Link href={ROUTES.activate} target="_blank" className="underline">
                            Activate your key
                        </Link>
                        , then come back to this tab — your data stays here.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
