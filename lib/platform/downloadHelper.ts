/**
 * Cross-platform file save.
 *
 * In the browser: triggers the standard <a download> dance — unchanged
 * behaviour, no dependency on Tauri modules at import time.
 *
 * In the Tauri desktop app: opens the OS Save As dialog so the user
 * picks the destination, writes the bytes there, and (on success) can
 * be revealed in the file explorer from the returned path. Users
 * complained they couldn't find their exports — the webview's silent
 * default-download was going to %USERPROFILE%\Downloads with no feedback.
 *
 * All converters (jsonToCsv, jsonToXlsx, jsonToHtml, zipExporter, …)
 * call this instead of rolling their own anchor-click.
 */

export interface SaveResult {
    /** 'desktop' when the Tauri Save dialog ran; 'web' when the <a download> fallback did. */
    platform: 'desktop' | 'web';
    /** True iff the user cancelled the native Save dialog (desktop only). */
    cancelled: boolean;
    /**
     * Absolute path written to, iff platform === 'desktop' AND !cancelled.
     * In the browser the download target is not visible to JS by design.
     */
    path?: string;
    /** Error message if the save failed. */
    error?: string;
}

type SaveFilter = { name: string; extensions: string[] };

/**
 * True when running inside the Tauri desktop shell. Checked via
 * `__TAURI_INTERNALS__` which is injected before any user script runs,
 * so it's safe to call during module init on either platform.
 */
export function isTauriRuntime(): boolean {
    if (typeof window === 'undefined') return false;
    // @ts-ignore — Tauri injects this; not part of lib.dom
    return !!window.__TAURI_INTERNALS__;
}

/**
 * Strip characters Windows (and some macOS/Linux shells) reject in file
 * names: < > : " | ? * / \ and ASCII control chars. Also trims trailing
 * dots and spaces (Windows strips them silently and the Save dialog can
 * reject names that end up empty). Falls back to 'export' when the input
 * sanitises to nothing. Preserves the extension if present.
 *
 * This is what fixes the Save As "File not found" dialog bug observed on
 * v0.1.2 when sourceFilename came from an input like `api?v=2.json` and
 * we passed `api?v=2.csv` straight into the dialog's defaultPath.
 */
export function sanitizeFilename(name: string): string {
    if (!name) return 'export';
    const lastDot = name.lastIndexOf('.');
    const stem = lastDot > 0 ? name.slice(0, lastDot) : name;
    const ext = lastDot > 0 ? name.slice(lastDot) : '';
    const cleanedStem = stem
        .replace(/[<>:"|?*\\/\u0000-\u001f]/g, '_')
        .replace(/[.\s]+$/g, '')
        .trim();
    const cleanedExt = ext
        .replace(/[<>:"|?*\\/\u0000-\u001f]/g, '_')
        .replace(/[.\s]+$/g, '');
    // Hard-cap at 240 chars so even with a long parent path we stay under
    // Windows' default 260-char MAX_PATH limit.
    const combined = (cleanedStem || 'export') + cleanedExt;
    return combined.length > 240 ? combined.slice(0, 240) : combined;
}

function filterForExtension(filename: string): SaveFilter[] {
    const dot = filename.lastIndexOf('.');
    if (dot === -1) return [];
    const ext = filename.slice(dot + 1).toLowerCase();
    const human: Record<string, string> = {
        csv: 'CSV (Comma-separated)',
        xlsx: 'Excel Workbook',
        xls: 'Excel 97-2003',
        json: 'JSON',
        jsonl: 'JSON Lines',
        html: 'HTML',
        zip: 'ZIP Archive',
        txt: 'Text',
    };
    return [{ name: human[ext] || ext.toUpperCase(), extensions: [ext] }];
}

/**
 * Normalise any blob-like input to a Uint8Array for Tauri's fs plugin,
 * which only accepts bytes. Keeps callers free to pass whatever they
 * already have (a prebuilt Blob, a plain string, a UA-generated workbook
 * Uint8Array, …) without doing their own conversion dance.
 */
async function toBytes(data: Blob | ArrayBuffer | Uint8Array | string): Promise<Uint8Array> {
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    // Blob
    return new Uint8Array(await data.arrayBuffer());
}

async function saveViaBrowserDownload(
    data: Blob | ArrayBuffer | Uint8Array | string,
    filename: string,
    mimeType: string,
): Promise<SaveResult> {
    let blob: Blob;
    if (data instanceof Blob) {
        blob = data;
    } else if (typeof data === 'string') {
        blob = new Blob([data], { type: mimeType });
    } else {
        // Uint8Array / ArrayBuffer. Cast through BlobPart; TS's lib doesn't
        // narrow this well for Uint8Array<ArrayBufferLike>.
        blob = new Blob([data as BlobPart], { type: mimeType });
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser a tick to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return { platform: 'web', cancelled: false };
}

async function saveViaTauriDialog(
    data: Blob | ArrayBuffer | Uint8Array | string,
    filename: string,
): Promise<SaveResult> {
    const safeName = sanitizeFilename(filename);
    try {
        // Dynamic imports so the browser bundle never pulls Tauri modules
        // (they'd fail to resolve on the public site).
        const [{ save }, { invoke }] = await Promise.all([
            import('@tauri-apps/plugin-dialog'),
            import('@tauri-apps/api/core'),
        ]);
        const chosen = await save({
            defaultPath: safeName,
            filters: filterForExtension(safeName),
        });
        if (!chosen) return { platform: 'desktop', cancelled: true };
        const bytes = await toBytes(data);
        // write_bytes_to_path is a focused Tauri command we define in
        // src-tauri/src/commands.rs — avoids granting the webview broad
        // fs-plugin permissions when the only call-site is right here.
        // Tauri serialises Vec<u8> from a number[] / Uint8Array transparently.
        await invoke('write_bytes_to_path', { path: chosen, bytes: Array.from(bytes) });
        return { platform: 'desktop', cancelled: false, path: chosen };
    } catch (err) {
        return {
            platform: 'desktop',
            cancelled: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

/**
 * The one function every exporter should call.
 *
 * On desktop, surfaces the native Save As dialog and writes with the
 * fs plugin. On web, falls back to the <a download> dance. Returns a
 * SaveResult the caller can use to show a "Reveal in folder" affordance
 * (desktop only) or a plain success toast (web).
 */
export async function saveWithDialog(
    data: Blob | ArrayBuffer | Uint8Array | string,
    filename: string,
    mimeType: string = 'application/octet-stream',
): Promise<SaveResult> {
    if (isTauriRuntime()) {
        return saveViaTauriDialog(data, filename);
    }
    return saveViaBrowserDownload(data, filename, mimeType);
}

/**
 * Open the OS file explorer with the saved file highlighted (Windows
 * Explorer /select, macOS Finder reveal, Linux xdg-open on the parent).
 * No-op in the browser.
 */
export async function revealInFolder(path: string): Promise<void> {
    if (!isTauriRuntime()) return;
    try {
        const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
        await revealItemInDir(path);
    } catch {
        // Fall back to opening the containing folder — better than
        // silence if the reveal API isn't available on this platform.
        try {
            const { openPath } = await import('@tauri-apps/plugin-opener');
            const parent = path.replace(/[\\/][^\\/]+$/, '');
            if (parent) await openPath(parent);
        } catch {
            // No-op — if even opening fails, the user still has the path
            // in the toast's description.
        }
    }
}
