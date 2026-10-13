'use client';

import { AlertTriangle } from 'lucide-react';
import type { JiraChangelogStatus } from '@/lib/parsers/platform/jira';

const COPY: Record<Exclude<JiraChangelogStatus, 'present'>, string> = {
    missing:
        'No changelog found in this Jira payload. Re-export with ?expand=changelog on the Jira API URL to include the audit trail.',
    empty:
        'This Jira payload records zero changes, so there is no audit trail to export yet.',
};

export function JiraChangelogNotice({ status }: { status: JiraChangelogStatus | null }) {
    if (status === null || status === 'present') return null;

    return (
        <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
        >
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
            <p>{COPY[status]}</p>
        </div>
    );
}
