import { Metadata } from 'next';
import { Suspense } from 'react';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';
import { ActivateForm } from './ActivateForm';

/**
 * /activate — license activation entry point.
 *
 * Two paths:
 *   - Buyer clicks the link in their Gumroad receipt → arrives with
 *     ?key=XXX and the form pre-fills + auto-submits.
 *   - Buyer navigates manually → pastes their license key, clicks Activate.
 *
 * Shipped in M3 as the counterpart to the license-worker so buyers
 * actually have somewhere to go after checkout.
 */

export const metadata: Metadata = {
    ...buildPageMetadata({
        title: 'Activate your JsonExport Pro license',
        description:
            'Enter your Gumroad license key to unlock Pro features: unlimited file size, batch mode, folder-watch, and the desktop app.',
        canonicalPath: '/activate',
    }),
    robots: { index: false, follow: false },
};

export default function ActivatePage() {
    return (
        <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center px-4 py-12 sm:py-16">
            <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    JsonExport Pro
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Activate your license
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Paste the license key from your purchase email. One license works on
                    up to 3 devices.
                </p>

                <div className="mt-6">
                    {/*
                      ActivateForm uses useSearchParams (to pre-fill from
                      ?key=XXX). That hook needs a Suspense boundary when
                      used in a statically-exported route — otherwise the
                      prerender bails. The fallback mirrors the input UI so
                      no CLS when it hydrates.
                    */}
                    <Suspense
                        fallback={
                            <div className="space-y-4">
                                <div className="h-9 rounded-md bg-muted animate-pulse" />
                                <div className="h-9 rounded-md bg-primary/60 animate-pulse" />
                            </div>
                        }
                    >
                        <ActivateForm />
                    </Suspense>
                </div>

                <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
                    <p>
                        Haven&apos;t bought yet?{' '}
                        <a
                            href="https://gumroad.com/l/json_hub?src=activate_page"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                        >
                            Get a license — $9 lifetime →
                        </a>
                    </p>
                    <p className="mt-2">
                        Lost your key?{' '}
                        <a
                            href="https://help.gumroad.com/article/145-recover-license-key"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                        >
                            Gumroad can resend it.
                        </a>
                    </p>
                </div>
            </div>

            <a
                href={ROUTES.home}
                className="mt-6 text-sm text-muted-foreground hover:text-foreground"
            >
                ← Back to app
            </a>
        </main>
    );
}
