/**
 * Which tool controls people use, from `ui_interaction` events (key in the
 * `format` column), next to how many real files were loaded. Started
 * Nov 2026 so that "why do 43% of search visitors leave without loading a
 * file" can be answered from clicks instead of guessed.
 */
export interface UiEvent {
    event_name: string;
    format?: string | null;
    is_sample?: unknown;
}

export interface UiInteractionSummary {
    byControl: Array<[string, number]>;
    filesLoaded: number;
}

export function computeUiInteractions(events: UiEvent[]): UiInteractionSummary {
    const counts = new Map<string, number>();
    let filesLoaded = 0;
    for (const e of events) {
        if (e.event_name === 'ui_interaction' && e.format) counts.set(e.format, (counts.get(e.format) || 0) + 1);
        else if (e.event_name === 'parse_success' && !(e.is_sample === 1 || e.is_sample === true)) filesLoaded++;
    }
    return { byControl: [...counts].sort((a, b) => b[1] - a[1]), filesLoaded };
}

export function formatUiInteractions(s: UiInteractionSummary): string[] {
    if (s.byControl.length === 0) return ['No control clicks recorded yet (tracking started Nov 2026).'];
    return [`files loaded: ${s.filesLoaded}`, ...s.byControl.map(([k, n]) => `${k.padEnd(18)} ${n}`)];
}
