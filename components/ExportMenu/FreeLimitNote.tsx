'use client';

import { FREE_EXPORT_LIMIT_LABEL } from '@/lib/license/limits';
import { PRO_PRICE_LABEL } from '@/lib/license/pricing';
import { useFreeLimit } from '@/lib/license/useFreeLimit';

/**
 * States the free limit before the export click, for files over it. The
 * paywall used to be the first a visitor heard of the limit, after loading
 * and checking their data on a page whose title says "Free".
 */
export function FreeLimitNote() {
    const free = useFreeLimit();
    if (!free) return null;
    return (
        <p className="text-xs text-muted-foreground text-center" data-testid="free-limit-note">
            {free.sizeLabel} file: the free export covers the first {FREE_EXPORT_LIMIT_LABEL} ({free.sampleRows.toLocaleString()} of{' '}
            {free.totalRows.toLocaleString()} rows). The whole file exports with Pro, {PRO_PRICE_LABEL} once.
        </p>
    );
}
