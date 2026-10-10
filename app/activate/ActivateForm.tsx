'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { activateLicense } from '@/lib/license/activation';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

type Status =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'success'; devicesUsed?: number; devicesAllowed?: number; email?: string | null }
    | { kind: 'error'; message: string };

// Translate the server's machine error codes into something a buyer with a
// mistyped key or a stale link can actually act on. Raw `Gumroad HTTP 404`
// leaked straight through before — buyers would email support confused about
// why we were mentioning Gumroad at all.
function friendlyError(code: string | undefined, serverMessage: string | undefined): string {
    switch (code) {
        case 'invalid_license':
            return 'That key wasn’t recognized. Double-check for typos — the exact key is in your purchase email (format: XXXX-XXXX-XXXX-XXXX).';
        case 'license_revoked':
            return 'This license is no longer active (it may have been refunded). Reply to your purchase email if this is unexpected.';
        case 'max_uses_exceeded':
            return 'Your license is already active on 3 devices. Deactivate one from its JsonExport Pro settings before adding this one.';
        case 'empty_key':
            return 'Enter your license key.';
        case 'network':
            return 'Network error — check your connection and try again.';
        default:
            return serverMessage || 'Something went wrong. Try again in a moment.';
    }
}

export function ActivateForm() {
    const params = useSearchParams();
    const router = useRouter();
    const [key, setKey] = useState('');
    const [status, setStatus] = useState<Status>({ kind: 'idle' });
    const [autoSubmitted, setAutoSubmitted] = useState(false);

    // Prefill + auto-submit when the user arrives from a Gumroad post-purchase
    // redirect that includes ?key=XXX. Only auto-submits once per load.
    useEffect(() => {
        const fromUrl = params?.get('key');
        if (fromUrl && !autoSubmitted) {
            setKey(fromUrl);
            setAutoSubmitted(true);
            void submit(fromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    async function submit(value: string) {
        setStatus({ kind: 'loading' });
        trackConversionEvent('upsell_clicked', {
            upsell_type: 'activate_submit',
            key_length: value.length,
        });
        const result = await activateLicense(value);
        if (result.ok) {
            setStatus({
                kind: 'success',
                devicesUsed: result.devicesUsed,
                devicesAllowed: result.devicesAllowed,
                email: result.email,
            });
            trackConversionEvent('feedback_submitted', {
                rating: 'positive',
                comment: 'license_activated',
                has_comment: true,
            });
            // Give the user ~3s to read the confirmation before auto-redirect
            setTimeout(() => router.push('/?pro=activated'), 3000);
        } else {
            setStatus({ kind: 'error', message: friendlyError(result.error, result.message) });
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (status.kind === 'loading') return;
        void submit(key);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="license-key" className="text-sm font-medium">
                    License key
                </label>
                <input
                    id="license-key"
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={status.kind === 'loading'}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            <button
                type="submit"
                disabled={status.kind === 'loading' || !key.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50"
            >
                {status.kind === 'loading' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {status.kind === 'loading' ? 'Activating…' : 'Activate Pro'}
            </button>

            {status.kind === 'error' && (
                <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"
                >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    <div>
                        <p className="font-medium text-destructive">Couldn&apos;t activate</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{status.message}</p>
                    </div>
                </div>
            )}

            {status.kind === 'success' && (
                <div
                    role="status"
                    className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm"
                >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">
                            Pro activated — welcome!
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Using {status.devicesUsed} of {status.devicesAllowed} device slots.
                            {status.email ? ` Linked to ${status.email}.` : ''} Redirecting…
                        </p>
                    </div>
                </div>
            )}
        </form>
    );
}
