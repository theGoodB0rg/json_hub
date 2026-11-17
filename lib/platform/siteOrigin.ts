import { invoke } from '@tauri-apps/api/core';

/**
 * Where the site's server routes (/_l license, /_i telemetry) live.
 *
 * The desktop app's webview origin is http://tauri.localhost (Windows) or
 * tauri://localhost (macOS/Linux), which serves only the bundled files, so
 * anything posted same-origin there is lost. The desktop app must use the
 * production origin; the workers answer with Access-Control-Allow-Origin: *.
 */
export const PRODUCTION_ORIGIN = 'https://jsonexport.com';

type Loc = { protocol: string; hostname: string; origin: string };

export function isDesktopWebview(location: Loc): boolean {
    return location.protocol === 'tauri:' || location.hostname === 'tauri.localhost';
}

export function siteOrigin(location: Loc): string {
    return isDesktopWebview(location) ? PRODUCTION_ORIGIN : location.origin;
}

/**
 * Install channel of the desktop app, sent in the telemetry `referrer` column
 * (a desktop webview has no referrer) so Store and GitHub installs can be
 * counted apart without a D1 schema change.
 */
export type DesktopChannel = 'app:store' | 'app:github';
let channel: DesktopChannel | null = null;

/** Asks the app once whether it runs from a Microsoft Store (MSIX) install. */
export async function detectDesktopChannel(): Promise<DesktopChannel> {
    const store = await invoke<boolean>('is_store_install').catch(() => false);
    channel = store ? 'app:store' : 'app:github';
    return channel;
}

/** The desktop channel tag, or null on the website. */
export function desktopReferrer(location: Loc): string | null {
    if (!isDesktopWebview(location)) return null;
    return channel ?? 'app:desktop'; // before detection finishes
}
