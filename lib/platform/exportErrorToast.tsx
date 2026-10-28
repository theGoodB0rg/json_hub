'use client';

import React from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { reloadForFreshChunks } from './chunkRecovery';

/**
 * Tells the user an export failed.
 *
 * Until now a failed export only wrote into `parseErrors`, which renders in
 * the input pane's error bar. On mobile the export button lives on the
 * sticky bar under the *preview* tab, so the message was off-screen for the
 * people most likely to hit it — they saw a button that did nothing. The
 * telemetry shows exactly that: three taps in 22 seconds, then silence.
 *
 * A toast is visible wherever the user is standing.
 */
export function showExportErrorToast(message: string) {
    toast({
        variant: 'destructive',
        title: 'Export failed',
        description: message,
    });
}

/**
 * The chunk-load variant: the app itself failed to deliver, so the action is
 * a reload rather than anything the user can do to their data.
 *
 * `inputPreserved` is false when the input was too big for sessionStorage or
 * storage was unavailable; the copy then says plainly that reloading costs
 * the pasted data, instead of implying it is safe.
 */
export function showChunkRecoveryToast(inputPreserved: boolean) {
    toast({
        variant: 'destructive',
        title: 'The app updated while this tab was open',
        description: inputPreserved
            ? 'Part of the converter could not load. Reload to finish your export — your data is kept.'
            : 'Part of the converter could not load. Reloading fixes it, but this file is too large to keep — copy your input first.',
        action: (
            <ToastAction altText="Reload the page" onClick={() => reloadForFreshChunks()}>
                Reload
            </ToastAction>
        ),
    });
}

/** The export succeeded, but Excel's format limits forced some content to be shortened. */
export function showExcelLimitToast(description: string) {
    toast({
        title: 'Some cells were shortened',
        description,
    });
}
