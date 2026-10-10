import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { DebugLogView } from './DebugLogView';

/**
 * /debug — local-only, user-triggered log viewer for the desktop app.
 *
 * SECURITY MODEL
 * --------------
 * Nothing on this page talks to the network. The log it displays is read
 * from the local tauri app-data dir via a Tauri command we define
 * ourselves (read_recent_logs), and nothing is auto-copied, auto-uploaded,
 * or persisted beyond the viewer's clipboard when they explicitly click
 * "Copy". On the web (non-Tauri) build this page just explains that logs
 * only exist on the desktop app — the invoke() call fails gracefully and
 * the page shows the explanation instead of errors.
 *
 * The page is noindex,nofollow because it's an internal utility, not a
 * marketing surface.
 */

export const metadata: Metadata = {
    ...buildPageMetadata({
        title: 'JsonExport — Debug log viewer',
        description:
            'Local-only debug log viewer for the JsonExport desktop app. Shows the tail of the on-disk rotating log so you can paste it to support.',
        canonicalPath: '/debug',
    }),
    robots: { index: false, follow: false },
};

export default function DebugPage() {
    return (
        <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    JsonExport Diagnostics
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    Debug log viewer
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Shows the tail of the local log file written by the desktop app.
                    Nothing is uploaded or sent anywhere — this is strictly a read of
                    the file on your disk so you can paste the relevant lines when
                    reporting an issue.
                </p>
            </div>

            <DebugLogView />

            <section className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What is in the log</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Timestamps + severity + component name</li>
                    <li>Save operation outcomes (success / failure)</li>
                    <li>
                        <strong>Only basenames</strong> of files you saved
                        (e.g. <code>[…]/report.csv</code>) — never the folder path, never
                        the JSON you converted
                    </li>
                    <li>Updater polls and conversion event summaries</li>
                </ul>
                <p className="mt-3 font-medium text-foreground mb-1">What is NOT in the log</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Your JSON input or output content</li>
                    <li>Full absolute paths or your home directory</li>
                    <li>License keys, emails, or any auth material</li>
                </ul>
            </section>
        </main>
    );
}
