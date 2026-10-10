'use client';

import { useEffect, useState } from 'react';
import { Copy, RefreshCcw, Check, AlertCircle } from 'lucide-react';
import { isTauriRuntime } from '@/lib/platform/downloadHelper';

type State =
    | { kind: 'loading' }
    | { kind: 'web-only' }
    | { kind: 'error'; message: string }
    | { kind: 'ok'; log: string };

export function DebugLogView() {
    const [state, setState] = useState<State>({ kind: 'loading' });
    const [copied, setCopied] = useState(false);

    async function load() {
        setCopied(false);
        if (!isTauriRuntime()) {
            setState({ kind: 'web-only' });
            return;
        }
        setState({ kind: 'loading' });
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const log = await invoke<string>('read_recent_logs', { maxLines: 500 });
            setState({ kind: 'ok', log });
        } catch (err) {
            setState({
                kind: 'error',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older webviews — select the <pre>, user hits ctrl+c
        }
    }

    if (state.kind === 'web-only') {
        return (
            <div className="rounded-md border border-border/60 bg-card p-6 text-sm">
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                        <p className="font-medium">Open this page in the desktop app</p>
                        <p className="mt-1 text-muted-foreground">
                            Logs only exist on the installed desktop app — the web app
                            runs entirely in-browser and has no file to tail. Install
                            v0.1.2+ from the{' '}
                            <a
                                href="https://github.com/theGoodB0rg/json_hub/releases/latest"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline"
                            >
                                releases page
                            </a>
                            , open it, and navigate to the same URL to see your log.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (state.kind === 'loading') {
        return (
            <div className="rounded-md border border-border/60 bg-card p-6 text-sm text-muted-foreground">
                Reading log…
            </div>
        );
    }

    if (state.kind === 'error') {
        return (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
                <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    <div className="flex-1">
                        <p className="font-medium text-destructive">Couldn&apos;t read the log</p>
                        <p className="mt-1 text-xs text-muted-foreground break-all">{state.message}</p>
                    </div>
                    <button
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border/60 bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                    jsonexport.log — last 500 lines
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                    <button
                        onClick={() => void copyToClipboard(state.log)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy
                            </>
                        )}
                    </button>
                </div>
            </div>
            <pre className="max-h-[70vh] overflow-auto px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all">
                {state.log || '(empty)'}
            </pre>
        </div>
    );
}
