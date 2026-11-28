'use client';

import { PRO_PRICE_LABEL } from '@/lib/license/pricing';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BuyProLink } from '@/components/BuyProLink';
import { useAppStore } from '@/lib/store/store';
import { FREE_EXPORT_LIMIT_LABEL } from '@/lib/license/limits';
import { useFreeLimit } from '@/lib/license/useFreeLimit';
import { ROUTES } from '@/lib/routes';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

/**
 * The single paywall for the free tier. Opened by the store (`paywall` state)
 * when an export is over the free size, and by the batch button.
 *
 * Buying and activating reuse the existing Gumroad link and /activate page.
 * Activation in another tab reaches this one through the license restore in
 * ConverterApp, so the user can come back and export without reloading.
 *
 * Every way out is counted, with the paywall reason in `format`: a buy click
 * (`checkout_clicked`, via BuyProLink), the free sample (`paywall_sample_taken`)
 * or walking away (`paywall_dismissed`). Before, a paywall that was shown and
 * abandoned looked the same as one still open.
 */
export function ProPaywall() {
    const { paywall, setPaywall, selectedFormat, exportData } = useAppStore();
    const free = useFreeLimit();
    if (!paywall) return null;

    const close = () => setPaywall(null);
    const dismiss = () => {
        trackConversionEvent('paywall_dismissed', { format: paywall });
        close();
    };
    const isLargeFile = paywall === 'large_file';

    return (
        <Dialog open onOpenChange={(open) => !open && dismiss()}>
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
                                This file is {free?.sizeLabel}. The first {FREE_EXPORT_LIMIT_LABEL} export free
                                {free && <> ({free.sampleRows.toLocaleString()} of {free.totalRows.toLocaleString()} rows)</>}.
                                Pro exports the whole file, right here in your browser.
                            </span>
                        ) : (
                            <span className="block">
                                Convert a whole folder of JSON files in one go, right here in your browser.
                            </span>
                        )}
                        <span className="block">
                            {PRO_PRICE_LABEL} once, lifetime. Also unlocks batch conversion and the desktop app for files of any
                            size. Nothing is uploaded, ever.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {/* Free sample first: under the old order (buy first) 0 of the
                    paywall viewers took the sample or bought (Nov 22-28).
                    Someone who opens the sample has seen the tool work. */}
                <div className="flex flex-col gap-2">
                    {isLargeFile && free && (
                        <Button
                            size="lg"
                            onClick={() => {
                                trackConversionEvent('paywall_sample_taken', { format: paywall, row_count: free.sampleRows });
                                close();
                                void exportData(selectedFormat, { sampleRows: free.sampleRows });
                            }}
                        >
                            Download the first {free.sampleRows.toLocaleString()} rows ({free.percent}%) free
                        </Button>
                    )}
                    <Button asChild size="lg" variant={isLargeFile && free ? 'outline' : 'default'}>
                        <BuyProLink source={`paywall_${paywall}`}>Get Pro — {PRO_PRICE_LABEL}</BuyProLink>
                    </Button>
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
