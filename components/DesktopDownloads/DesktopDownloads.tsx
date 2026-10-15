'use client';

/**
 * DesktopDownloads — reads the latest GitHub Release at render time and
 * shows direct download buttons for each OS artifact. If no release exists
 * yet, shows a "Coming soon" state with an email-capture link.
 *
 * The GitHub API is called from the client so we don't need to re-deploy
 * the site each time we cut a new release — the next page load picks up
 * the newest artifacts automatically.
 *
 * Repo and endpoint are hardcoded; this component is single-purpose.
 */

import { useEffect, useState } from 'react';
import { Loader2, Download, Monitor, Apple, Terminal, AlertCircle } from 'lucide-react';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';
import { BuyProLink } from '@/components/BuyProLink';

const GH_RELEASES_API = 'https://api.github.com/repos/theGoodB0rg/json_hub/releases/latest';
const GH_RELEASES_PAGE = 'https://github.com/theGoodB0rg/json_hub/releases/latest';

interface Asset {
    name: string;
    browser_download_url: string;
    size: number;
}

interface Release {
    tag_name: string;
    name: string;
    published_at: string;
    html_url: string;
    assets: Asset[];
}

type OsKey = 'windows' | 'macos-arm' | 'macos-intel' | 'linux-deb' | 'linux-rpm' | 'linux-appimage';

interface OsBucket {
    key: OsKey;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    match: (name: string) => boolean;
}

// Classifier matches the actual filenames Tauri produces:
//   JsonExport_0.1.0_x64-setup.exe        / JsonExport_0.1.0_x64_en-US.msi
//   JsonExport_0.1.0_x64.dmg              / JsonExport_0.1.0_aarch64.dmg
//   json-export_0.1.0_amd64.deb           / json-export_0.1.0_amd64.AppImage
// Order matters — more specific matches first.
const BUCKETS: OsBucket[] = [
    {
        key: 'windows',
        label: 'Windows',
        sublabel: '.exe installer',
        icon: <Monitor className="h-5 w-5" aria-hidden />,
        match: (n) => /\.(exe|msi)$/i.test(n) && !/\.sig$/i.test(n),
    },
    {
        key: 'macos-arm',
        label: 'macOS (Apple Silicon)',
        sublabel: 'M1 / M2 / M3 — .dmg',
        icon: <Apple className="h-5 w-5" aria-hidden />,
        match: (n) => /\.dmg$/i.test(n) && /aarch64|arm64/i.test(n),
    },
    {
        key: 'macos-intel',
        label: 'macOS (Intel)',
        sublabel: 'x86_64 — .dmg',
        icon: <Apple className="h-5 w-5" aria-hidden />,
        match: (n) => /\.dmg$/i.test(n) && (/x64|x86_64/i.test(n) || !/aarch64|arm64/i.test(n)),
    },
    {
        key: 'linux-appimage',
        label: 'Linux (AppImage)',
        sublabel: 'Portable, no install',
        icon: <Terminal className="h-5 w-5" aria-hidden />,
        match: (n) => /\.appimage$/i.test(n),
    },
    {
        key: 'linux-deb',
        label: 'Linux (.deb)',
        sublabel: 'Debian / Ubuntu',
        icon: <Terminal className="h-5 w-5" aria-hidden />,
        match: (n) => /\.deb$/i.test(n),
    },
    {
        key: 'linux-rpm',
        label: 'Linux (.rpm)',
        sublabel: 'Fedora / RHEL / openSUSE',
        icon: <Terminal className="h-5 w-5" aria-hidden />,
        match: (n) => /\.rpm$/i.test(n),
    },
];

function formatSize(bytes: number): string {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        const now = Date.now();
        const days = Math.floor((now - d.getTime()) / 86_400_000);
        if (days === 0) return 'today';
        if (days === 1) return 'yesterday';
        if (days < 30) return `${days} days ago`;
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

export function DesktopDownloads() {
    const [state, setState] = useState<
        | { kind: 'loading' }
        | { kind: 'ready'; release: Release; buckets: Record<OsKey, Asset | null> }
        | { kind: 'none' }
        | { kind: 'error'; message: string }
    >({ kind: 'loading' });

    useEffect(() => {
        let cancelled = false;
        fetch(GH_RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
            .then(async (res) => {
                if (res.status === 404) {
                    if (!cancelled) setState({ kind: 'none' });
                    return;
                }
                if (!res.ok) throw new Error(`GitHub API ${res.status}`);
                const data: Release = await res.json();
                // Bucket assets by OS. First match wins per bucket. If a bucket has no
                // matching asset we show it as "unavailable" rather than hiding — users
                // learn which platforms the release actually covers.
                const buckets: Record<OsKey, Asset | null> = {
                    windows: null,
                    'macos-arm': null,
                    'macos-intel': null,
                    'linux-deb': null,
                    'linux-rpm': null,
                    'linux-appimage': null,
                };
                for (const bucket of BUCKETS) {
                    const match = data.assets.find((a) => bucket.match(a.name));
                    if (match) buckets[bucket.key] = match;
                }
                if (!cancelled) setState({ kind: 'ready', release: data, buckets });
            })
            .catch((err) => {
                if (!cancelled) setState({ kind: 'error', message: err?.message || 'Unknown error' });
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (state.kind === 'loading') {
        return (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading latest release…
            </div>
        );
    }

    if (state.kind === 'none') {
        return (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
                <h3 className="mt-3 text-base font-semibold">Desktop app coming soon</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    The desktop installers are in the final build pipeline. Buy a license
                    now to lock in $9 — we&apos;ll email you the download links the moment
                    the release ships.
                </p>
                <BuyProLink
                    source="desktop_landing_waitlist"
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                >
                    Pre-order $9
                </BuyProLink>
            </div>
        );
    }

    if (state.kind === 'error') {
        return (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                <p className="font-medium">Couldn&apos;t fetch the latest release.</p>
                <p className="mt-1 text-muted-foreground">{state.message}</p>
                <a
                    href={GH_RELEASES_PAGE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-primary underline"
                >
                    Browse releases on GitHub →
                </a>
            </div>
        );
    }

    const { release, buckets } = state;

    const trackDownload = (osKey: OsKey, assetName: string) => {
        trackConversionEvent('upsell_clicked', {
            upsell_type: 'desktop_download',
            os: osKey,
            asset_name: assetName,
            release_tag: release.tag_name,
        });
    };

    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card">
                <ul className="divide-y divide-border">
                    {BUCKETS.map((bucket) => {
                        const asset = buckets[bucket.key];
                        return (
                            <li key={bucket.key} className="flex items-center gap-4 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                    {bucket.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium">{bucket.label}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {asset ? asset.name : bucket.sublabel}
                                    </p>
                                </div>
                                {asset ? (
                                    <a
                                        href={asset.browser_download_url}
                                        onClick={() => trackDownload(bucket.key, asset.name)}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition hover:bg-accent"
                                    >
                                        <Download className="h-4 w-4" aria-hidden />
                                        {formatSize(asset.size)}
                                    </a>
                                ) : (
                                    <span className="shrink-0 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-xs text-muted-foreground">
                                        Not in this release
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
            <p className="text-center text-xs text-muted-foreground">
                Version <strong>{release.tag_name}</strong> · published {formatDate(release.published_at)} ·{' '}
                <a href={release.html_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    release notes
                </a>
            </p>
        </div>
    );
}
