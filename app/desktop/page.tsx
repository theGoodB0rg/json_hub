import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';
import { DesktopDownloads } from '@/components/DesktopDownloads';

/**
 * /desktop — Pro landing page.
 *
 * Shipped in M2 of MONETIZATION_ROADMAP_2026-10-10.md. The dynamic
 * download table lives in a client component (DesktopDownloads) so this
 * page stays statically exportable while asset URLs auto-refresh after
 * each GitHub release — no redeploy needed per release.
 */

export const metadata: Metadata = {
    ...buildPageMetadata({
        title: 'JsonExport Desktop Pro — $9 lifetime, no subscription',
        description:
            'Native desktop JSON → Excel/CSV converter. Handle 1 GB+ files, batch convert folders, and watch directories for new files. $9 one-time, lifetime license.',
        canonicalPath: ROUTES.desktop,
    }),
    keywords: [
        'json to excel desktop',
        'batch json converter',
        'json folder watcher',
        'large json excel',
        'json export pro',
        'offline json converter',
    ],
};

const GUMROAD_URL = 'https://pro.jsonexport.com/l/json_hub?src=desktop_landing';

export default function DesktopPage() {
    return (
        <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
            <section className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    JsonExport Pro
                </p>
                <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                    Convert <em className="not-italic text-primary">any</em> JSON file.
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
                    The free web app handles files up to 10 MB. The desktop app handles
                    gigabytes, converts entire folders at once, and watches directories
                    for new files you drop in. <strong>$9 one-time. Lifetime license.</strong>
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <a
                        href={GUMROAD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
                    >
                        Buy Pro — $9 lifetime
                    </a>
                    <a
                        href="#downloads"
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium transition hover:bg-accent"
                    >
                        See downloads
                    </a>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                    Windows · macOS (Intel + Apple Silicon) · Linux. Instant delivery via email.
                </p>
            </section>

            <section className="mt-16" aria-labelledby="comparison-heading">
                <h2 id="comparison-heading" className="text-center text-2xl font-semibold">
                    What you get
                </h2>
                <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-left">
                                <th className="px-4 py-3 font-medium">Feature</th>
                                <th className="px-4 py-3 font-medium">Web Free</th>
                                <th className="px-4 py-3 font-medium">Web Pro</th>
                                <th className="px-4 py-3 font-medium text-primary">Desktop Pro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {[
                                ['Max file size', '10 MB', 'Unlimited', 'Unlimited (streamed)'],
                                ['Format support', 'XLSX, CSV, JSON, HTML, DOCX, ZIP', 'All formats', 'All formats'],
                                ['Nested JSON flattening', 'Yes', 'Yes', 'Yes'],
                                ['Batch convert folders', '—', '—', 'Yes'],
                                ['Watch folder for new files', '—', '—', 'Yes'],
                                ['Streaming parser for huge files', '—', '—', 'Yes (Rust engine)'],
                                ['Works offline', '—', '—', 'Yes'],
                                ['Auto-updates', 'N/A', 'N/A', 'Yes'],
                                ['Price', 'Free', '$9 lifetime', '$9 lifetime (same license)'],
                            ].map(([feature, free, webPro, desktopPro]) => (
                                <tr key={feature as string}>
                                    <td className="px-4 py-3 font-medium">{feature}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{free}</td>
                                    <td className="px-4 py-3">{webPro}</td>
                                    <td className="px-4 py-3 font-medium text-primary">{desktopPro}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                    One license unlocks both the web Pro features and the desktop app.
                </p>
            </section>

            <section id="downloads" className="mt-16" aria-labelledby="downloads-heading">
                <h2 id="downloads-heading" className="text-center text-2xl font-semibold">
                    Download the Desktop app
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
                    The app itself is free to download and runs in trial mode. Pro features
                    unlock when you enter your license key — buy via the button above.
                </p>
                <div className="mt-6">
                    <DesktopDownloads />
                </div>
            </section>

            <section className="mt-16" aria-labelledby="why-heading">
                <h2 id="why-heading" className="text-center text-2xl font-semibold">
                    Why desktop?
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-card p-5">
                        <h3 className="font-semibold">Handles 1 GB+ files</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Native Rust streaming parser processes huge JSON dumps without
                            loading the whole file into memory. The browser can&apos;t do this.
                        </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-5">
                        <h3 className="font-semibold">Batch + folder-watch</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Drop dozens of JSON files into a folder. The app watches for
                            new files and converts them to XLSX/CSV automatically.
                        </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-5">
                        <h3 className="font-semibold">Fully offline</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            All processing happens locally. Your files never leave your
                            machine. Works on air-gapped networks.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-16 rounded-lg border border-border bg-muted/30 p-6 text-center">
                <h2 className="text-xl font-semibold">Ready?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    One-time payment, lifetime access, all future updates included.
                </p>
                <a
                    href={GUMROAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
                >
                    Buy JsonExport Pro — $9
                </a>
                <p className="mt-3 text-xs text-muted-foreground">
                    30-day refund if it doesn&apos;t work for you.
                </p>
            </section>
        </main>
    );
}
