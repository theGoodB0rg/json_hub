'use client';

import { Upload, ClipboardPaste, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shown over the empty editor. Nov 2026 (visitor ids, 4.5 days): of 39
 * search visitors landing on /json-to-excel, 27 never touched the tool. The
 * only start controls were icon buttons and a faint placeholder that looked
 * like data already loaded. This states the three ways in, in words.
 *
 * The wrapper ignores the pointer so typing / Ctrl+V into the editor behind
 * it still works; only the buttons take clicks.
 */
export function EmptyInputPrompt({
    sourceLabel,
    onChooseFile,
    onPaste,
    onSample,
}: {
    sourceLabel: string;
    onChooseFile: () => void;
    onPaste: () => void;
    onSample?: () => void;
}) {
    return (
        <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center p-4 pt-6"
            data-testid="empty-input-prompt"
        >
            <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-background/90 px-6 py-6 text-center shadow-sm backdrop-blur-sm">
                <Upload className="h-8 w-8 text-primary" aria-hidden />
                <p className="text-base font-semibold text-foreground">
                    Drop your {sourceLabel} file here
                </p>
                <p className="text-xs text-muted-foreground">
                    or paste it with Ctrl+V. It stays on your device.
                </p>
                <div className="pointer-events-auto flex flex-wrap justify-center gap-2 pt-1">
                    <Button size="sm" onClick={onChooseFile} data-track="empty_upload" className="gap-1.5">
                        <Upload className="h-4 w-4" aria-hidden />
                        Choose file
                    </Button>
                    <Button size="sm" variant="outline" onClick={onPaste} data-track="empty_paste" className="gap-1.5">
                        <ClipboardPaste className="h-4 w-4" aria-hidden />
                        Paste
                    </Button>
                </div>
                {onSample && (
                    <button
                        type="button"
                        onClick={onSample}
                        data-track="empty_sample"
                        className="pointer-events-auto inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                    >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        No file handy? Try sample data
                    </button>
                )}
            </div>
        </div>
    );
}
