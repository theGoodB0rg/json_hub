'use client';

import React from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { revealInFolder, type SaveResult } from './downloadHelper';

/**
 * Show the right toast for a SaveResult.
 *
 * - Desktop save: title + absolute path + "Reveal" action that opens the
 *   OS file explorer with the file highlighted. This is the fix for the
 *   recurring "I can't find my exports" complaint.
 * - Desktop cancel: silent — the user chose to cancel, no need to pester.
 * - Desktop error: destructive toast with the error message.
 * - Web: a brief confirmation naming the downloaded filename, so people
 *   who missed the browser's own notification still get feedback.
 */
export function showSaveResultToast(result: SaveResult, filename: string) {
    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Save failed',
            description: result.error,
        });
        return;
    }
    if (result.cancelled) return;

    if (result.platform === 'desktop' && result.path) {
        const path = result.path;
        toast({
            title: 'Saved',
            description: path,
            action: (
                <ToastAction
                    altText="Reveal file in folder"
                    onClick={() => {
                        void revealInFolder(path);
                    }}
                >
                    Reveal
                </ToastAction>
            ),
        });
        return;
    }

    toast({
        title: 'Downloaded',
        description: filename,
    });
}
