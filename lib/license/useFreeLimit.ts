'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store/store';
import { useProStore } from '@/lib/store/proStore';
import { recordCount } from '@/lib/parsers/unwrapper';
import { FREE_EXPORT_LIMIT_BYTES, freeSampleRows } from './limits';

export interface FreeLimitState {
    /** Records the free sample exports. */
    sampleRows: number;
    totalRows: number;
    /** Whole-number share of the file the free sample covers. */
    percent: number;
    sizeLabel: string;
}

/**
 * What the free tier allows for the file that is loaded now, or null when the
 * export is free in full (file under the limit, or the user has Pro).
 * Shared by the paywall and the note beside the export button so both quote
 * the same numbers.
 */
export function useFreeLimit(): FreeLimitState | null {
    const sourceBytes = useAppStore((s) => s.sourceBytes);
    const parsedData = useAppStore((s) => s.parsedData);
    const isPro = useProStore((s) => s.isPro);
    const over = !isPro && parsedData != null && sourceBytes > FREE_EXPORT_LIMIT_BYTES;

    return useMemo(() => {
        if (!over) return null;
        const totalRows = recordCount(parsedData);
        const sampleRows = freeSampleRows(totalRows, sourceBytes);
        return {
            sampleRows,
            totalRows,
            percent: Math.floor((sampleRows / Math.max(totalRows, 1)) * 100),
            sizeLabel: `${Math.round(sourceBytes / (1024 * 1024))} MB`,
        };
    }, [over, parsedData, sourceBytes]);
}
