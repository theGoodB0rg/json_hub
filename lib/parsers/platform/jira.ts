/**
 * Jira issue-search pre-processor (REST API v2 / v3, `/search` with
 * `expand=changelog,names`).
 *
 * Why this exists
 * ---------------
 * Four separate users left the same negative feedback — "Missing changelog" —
 * on exports from the homepage. The changelog was never actually dropped: the
 * generic flattener emitted it as `changelog.histories.0.author.avatarUrls.
 * 48x48`-style columns, one set per history index. Measured against a real
 * Apache Kafka issue search (5 issues, `expand=changelog`):
 *
 *   flat mode        5 rows  x 851 columns  (575 of them changelog, 41% filled)
 *   relational mode  194 rows x 268 columns (Cartesian: histories x items)
 *
 * Both are faithful to the input and both are unusable. A user scrolling 575
 * near-empty columns reasonably concludes the changelog is missing.
 *
 * What this does instead
 * ----------------------
 *   flat        one row per issue. The changelog is condensed into readable
 *               summary columns plus derived cycle/lead time, which is what
 *               people open a Jira export to compute.
 *   relational  one row per changelog item — the audit trail, long-format,
 *               one line per actual field change. No Cartesian blow-up,
 *               because issue fields are carried as context rather than
 *               multiplied out.
 *
 * Custom fields are resolved through the response's own `names` map, so
 * `customfield_12310420` becomes `Global Rank` instead of an opaque id.
 */

import type { FlattenMode, PlatformParser } from './types';
import { dropEmptyColumns, joinCell } from './types';

export interface JiraChangelogItem {
    field?: string;
    fieldtype?: string;
    fieldId?: string;
    from?: string | null;
    fromString?: string | null;
    to?: string | null;
    toString?: string | null;
}

export interface JiraChangelogHistory {
    id?: string;
    author?: JiraUser;
    created?: string;
    items?: JiraChangelogItem[];
}

export interface JiraUser {
    accountId?: string;
    name?: string;
    key?: string;
    displayName?: string;
    emailAddress?: string;
    active?: boolean;
}

export interface JiraIssue {
    id?: string;
    key?: string;
    self?: string;
    fields?: Record<string, any>;
    changelog?: {
        startAt?: number;
        maxResults?: number;
        total?: number;
        histories?: JiraChangelogHistory[];
    };
}

export interface JiraSearchResponse {
    expand?: string;
    startAt?: number;
    maxResults?: number;
    total?: number;
    issues: JiraIssue[];
    names?: Record<string, string>;
    schema?: Record<string, any>;
}

/** Status categories Jira uses for its own board columns. */
const IN_PROGRESS_HINTS = /in progress|in review|in development|started|doing/i;
const DONE_HINTS = /done|resolved|closed|complete|shipped/i;

/**
 * Structural detection.
 *
 * Deliberately strict: requires an `issues` array whose first entry carries
 * the Jira-specific `key` + `fields` pairing. A bare array of objects that
 * happens to have a `key` property must NOT match — that would silently
 * reshape unrelated user data.
 */
export function isJiraSearchResponse(data: unknown): data is JiraSearchResponse {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const d = data as Record<string, any>;
    if (!Array.isArray(d.issues) || d.issues.length === 0) return false;

    const first = d.issues[0];
    if (!first || typeof first !== 'object' || Array.isArray(first)) return false;

    // `fields` is the load-bearing marker — every Jira issue representation
    // has it, and nothing else we support pairs it with a string `key`.
    const hasFields = first.fields !== null && typeof first.fields === 'object';
    const hasKey = typeof first.key === 'string' || typeof first.id === 'string';
    return hasFields && hasKey;
}

/** `{ name: 'Open' }` → `'Open'`; `{ displayName }` → name; scalars pass through. */
function readable(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) return joinCell(value.map(readable));
    if (typeof value === 'object') {
        const o = value as Record<string, any>;
        const label = o.displayName ?? o.name ?? o.value ?? o.key ?? o.id;
        if (label !== undefined && label !== null && typeof label !== 'object') return String(label);
        return '';
    }
    return '';
}

function userName(u: JiraUser | undefined | null): string {
    if (!u) return '';
    return u.displayName || u.name || u.emailAddress || u.accountId || u.key || '';
}

/**
 * Collapse a changed value to something that occupies exactly one line.
 *
 * `changelog.log` promises one line per change, and people filter it with
 * Excel's text tools. A description edit carries the entire new description —
 * newlines, blank lines and all — which turned a 48-change log into 182 lines
 * and silently broke that promise. Caught by the real-world suite against
 * Apache Kafka KAFKA-20253, not by reading the code.
 */
function oneLine(value: string, maxLength = 120): string {
    const collapsed = value.replace(/\s+/g, ' ').trim();
    return collapsed.length > maxLength ? collapsed.slice(0, maxLength - 1) + '…' : collapsed;
}

function isoDay(ts: string | undefined | null): string {
    if (!ts) return '';
    return String(ts).slice(0, 10);
}

function parseTime(ts: string | undefined | null): number | null {
    if (!ts) return null;
    const t = Date.parse(ts);
    return Number.isFinite(t) ? t : null;
}

function daysBetween(fromMs: number | null, toMs: number | null): number | null {
    if (fromMs === null || toMs === null || toMs < fromMs) return null;
    return Math.round(((toMs - fromMs) / 86_400_000) * 100) / 100;
}

/** Chronological history list — Jira returns newest-first in some versions. */
function orderedHistories(issue: JiraIssue): JiraChangelogHistory[] {
    const hs = issue.changelog?.histories;
    if (!Array.isArray(hs)) return [];
    return [...hs].sort((a, b) => (parseTime(a.created) ?? 0) - (parseTime(b.created) ?? 0));
}

interface ChangeEvent {
    at: string;
    atMs: number | null;
    author: string;
    field: string;
    fieldtype: string;
    from: string;
    to: string;
}

function changeEvents(issue: JiraIssue): ChangeEvent[] {
    const out: ChangeEvent[] = [];
    for (const h of orderedHistories(issue)) {
        const author = userName(h.author);
        const at = h.created || '';
        const atMs = parseTime(at);
        for (const item of Array.isArray(h.items) ? h.items : []) {
            out.push({
                at,
                atMs,
                author,
                field: item.field || item.fieldId || '',
                fieldtype: item.fieldtype || '',
                // Prefer the display string; fall back to the raw id so a
                // transition is never rendered as an empty cell.
                from: item.fromString ?? (item.from != null ? String(item.from) : ''),
                to: item.toString ?? (item.to != null ? String(item.to) : ''),
            });
        }
    }
    return out;
}

/**
 * Condense a changelog into columns a person can read and sort on.
 * Everything here is derived from `events`; nothing is invented.
 */
function summariseChangelog(issue: JiraIssue, createdMs: number | null): Record<string, any> {
    const events = changeEvents(issue);
    const histories = orderedHistories(issue);
    const declaredTotal = issue.changelog?.total;

    if (events.length === 0) {
        // Still emit the shape so the column exists for issues that simply
        // have no recorded changes — a blank cell reads as "no changes",
        // a missing column reads as "this tool lost my data".
        return {
            'changelog.entries': 0,
            'changelog.log': '',
        };
    }

    const statusEvents = events.filter((e) => e.field.toLowerCase() === 'status');
    const assigneeEvents = events.filter((e) => e.field.toLowerCase() === 'assignee');

    // Status path: initial state of the first transition, then each landing.
    const statusPath: string[] = [];
    if (statusEvents.length > 0) {
        if (statusEvents[0].from) statusPath.push(statusEvents[0].from);
        for (const e of statusEvents) statusPath.push(e.to);
    }

    const firstInProgress = statusEvents.find((e) => IN_PROGRESS_HINTS.test(e.to));
    // Last entry into a done-ish status, so a reopen-then-close reports the
    // close that actually stuck.
    const lastDone = [...statusEvents].reverse().find((e) => DONE_HINTS.test(e.to));
    // A reopen is a transition *out of* a done state.
    const reopenCount = statusEvents.filter(
        (e) => DONE_HINTS.test(e.from) && !DONE_HINTS.test(e.to)
    ).length;

    const inProgressMs = firstInProgress?.atMs ?? null;
    const doneMs = lastDone?.atMs ?? null;

    const last = events[events.length - 1];

    const summary: Record<string, any> = {
        'changelog.entries': events.length,
        'changelog.historyCount': histories.length,
        'changelog.firstChangeAt': events[0].at,
        'changelog.lastChangeAt': last.at,
        'changelog.lastChangedBy': last.author,
        'changelog.fieldsChanged': joinCell(Array.from(new Set(events.map((e) => e.field))).sort()),
        'changelog.contributors': joinCell(
            Array.from(new Set(events.map((e) => e.author).filter(Boolean))).sort()
        ),
        'changelog.statusPath': statusPath.join(' → '),
        'changelog.statusChanges': statusEvents.length,
        'changelog.reopenCount': reopenCount,
        'changelog.assigneeChanges': assigneeEvents.length,
        'changelog.assigneeHistory': joinCell(assigneeEvents.map((e) => e.to || '(unassigned)'), ' → '),
        'changelog.firstInProgressAt': firstInProgress?.at || '',
        'changelog.doneAt': lastDone?.at || '',
        // Cycle time: work started → finished. Lead time: created → finished.
        // Both null rather than 0 when the issue never reached that state, so
        // averages downstream are not silently dragged toward zero.
        'changelog.cycleTimeDays': daysBetween(inProgressMs, doneMs),
        'changelog.leadTimeDays': daysBetween(createdMs, doneMs),
        // Full readable audit trail in one cell. Newlines survive XLSX and
        // CSV quoting, so this stays greppable in the spreadsheet.
        'changelog.log': events
            .map(
                (e) =>
                    `${isoDay(e.at)} ${oneLine(e.author, 40)}: ${oneLine(e.field, 40)} ` +
                    `${oneLine(e.from) || '∅'} → ${oneLine(e.to) || '∅'}`
            )
            .join('\n'),
    };

    // Jira paginates changelogs at 100 histories. If the payload says there
    // are more than it shipped, say so in the sheet rather than let the user
    // believe they exported a complete history.
    if (typeof declaredTotal === 'number' && declaredTotal > histories.length) {
        summary['changelog.truncated'] = true;
        summary['changelog.totalReported'] = declaredTotal;
    }

    return summary;
}

/** Flatten `fields`, resolving custom-field ids through the `names` map. */
function issueFieldColumns(
    fields: Record<string, any>,
    names: Record<string, string> | undefined
): Record<string, any> {
    const out: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
        if (value === null || value === undefined) continue;
        if (Array.isArray(value) && value.length === 0) continue;

        // customfield_12310420 → "Global Rank". Keep the raw id for anything
        // the names map does not cover so no field becomes unaddressable.
        const isCustom = key.startsWith('customfield_');
        const friendly = names?.[key];
        const column = isCustom && friendly && friendly !== key ? friendly : key;

        if (key === 'issuelinks') {
            // readable() reduces a link object to its numeric link id, so the
            // column came out as "12310260, 12310261" — technically present,
            // practically useless. Render the relationship instead.
            out[column] = joinCell((value as any[]).map(describeIssueLink));
            out[`${column}.count`] = (value as any[]).length;
            continue;
        }

        if (Array.isArray(value)) {
            out[column] = joinCell(value.map(readable));
            out[`${column}.count`] = value.length;
            continue;
        }

        if (typeof value === 'object') {
            const label = readable(value);
            if (label) {
                out[column] = label;
            } else {
                // Objects with no obvious label (progress, votes, timetracking)
                // expand one level so their numbers stay reachable.
                for (const [sub, subVal] of Object.entries(value as Record<string, any>)) {
                    if (subVal === null || typeof subVal === 'object') continue;
                    out[`${column}.${sub}`] = subVal;
                }
            }
            continue;
        }

        out[column] = value;
    }

    return out;
}

/**
 * Render one `issuelinks[]` entry as the relationship a person would read.
 *
 * A link is directional: the same record is "blocks" when read outward and
 * "is blocked by" when read inward, and only one of `inwardIssue` /
 * `outwardIssue` is populated. Picking the matching phrase is the difference
 * between "blocks SPARK-123" and a sentence that means the opposite.
 */
function describeIssueLink(link: any): string {
    if (!link || typeof link !== 'object') return '';

    const outward = link.outwardIssue;
    const inward = link.inwardIssue;
    const target = outward || inward;
    if (!target) return '';

    const phrase = outward ? link.type?.outward : link.type?.inward;
    const key = target.key || target.id || '';
    const summary = target.fields?.summary ? ` — ${target.fields.summary}` : '';
    const status = target.fields?.status ? ` [${readable(target.fields.status)}]` : '';

    return `${phrase ? phrase + ' ' : ''}${key}${status}${summary}`.trim();
}

/** Columns identifying the issue, repeated as context on long-format rows. */
function issueIdentity(issue: JiraIssue): Record<string, any> {
    const f = issue.fields || {};
    return {
        key: issue.key || '',
        id: issue.id || '',
        summary: f.summary ?? '',
        issuetype: readable(f.issuetype),
        status: readable(f.status),
        priority: readable(f.priority),
        assignee: readable(f.assignee),
        project: readable(f.project),
    };
}

/** One row per issue; changelog condensed into readable summary columns. */
function transformIssuesWide(data: JiraSearchResponse): Record<string, any>[] {
    const names = data.names;

    const rows = data.issues.map((issue) => {
        const fields = issue.fields || {};
        const createdMs = parseTime(fields.created);

        // statusCategory is what boards and reports group by ("To Do" /
        // "In Progress" / "Done"); the LOSSLESS invariant caught it being
        // dropped, since readable() stops at status.name.
        const statusCategory = readable(fields.status?.statusCategory);

        const row: Record<string, any> = {
            key: issue.key || '',
            id: issue.id || '',
            url: issue.self
                ? String(issue.self).replace('/rest/api/2/issue/', '/browse/').replace('/rest/api/3/issue/', '/browse/')
                : '',
            ...issueFieldColumns(fields, names),
            statusCategory,
            ...summariseChangelog(issue, createdMs),
        };

        // `key` must stay first and must not be overwritten by a field named
        // `key` inside `fields` (Jira has no such field today, but a custom
        // field resolved through `names` could collide).
        row.key = issue.key || '';
        return row;
    });

    return dropEmptyColumns(rows);
}

/**
 * One row per changelog item — the long-format audit trail.
 *
 * Issue identity is carried as context columns, so N issues with M total
 * changes produce exactly M rows. The old relational path produced the
 * Cartesian product of histories and items instead.
 */
function transformChangelogLong(data: JiraSearchResponse): Record<string, any>[] {
    const rows: Record<string, any>[] = [];

    for (const issue of data.issues) {
        const identity = issueIdentity(issue);
        const events = changeEvents(issue);

        if (events.length === 0) {
            // Preserve the issue even with no changes — dropping it would
            // silently lose a record the user exported.
            rows.push({ ...identity, 'change.at': '', 'change.author': '', 'change.field': '', 'change.from': '', 'change.to': '' });
            continue;
        }

        events.forEach((e, idx) => {
            rows.push({
                ...identity,
                'change.seq': idx + 1,
                'change.at': e.at,
                'change.date': isoDay(e.at),
                'change.author': e.author,
                'change.field': e.field,
                'change.fieldtype': e.fieldtype,
                'change.from': e.from,
                'change.to': e.to,
            });
        });
    }

    return dropEmptyColumns(rows);
}

export function transformJiraSearch(
    data: JiraSearchResponse,
    mode: FlattenMode = 'flat'
): Record<string, any>[] {
    if (!Array.isArray(data.issues)) return [];
    return mode === 'relational' ? transformChangelogLong(data) : transformIssuesWide(data);
}

/**
 * What a Jira issue sheet deliberately leaves behind.
 *
 * Everything here is either an API-internal handle (`self`, `expand`, numeric
 * `id`s used only for lookups), presentation chrome (`avatarUrls`, `iconUrl`,
 * `colorName`), or a value that survives in the other grain: per-change
 * timestamps and raw from/to ids are kept in full by the relational
 * (long-format) output, which is what the audit trail is for.
 */
const JIRA_OMISSIONS = [
    // Response envelope — pagination state, not user data.
    'expand', 'startAt', 'maxResults', 'total',
    // Lookup maps consumed to rename custom fields, not data in their own right.
    'names', 'schema',
    // API handles and presentation chrome, wherever they appear.
    '*.self', '*.expand', '*.iconUrl', '*.avatarUrls', '*.avatarHash',
    '*.timeZone', '*.active', '*.accountType', '*.hierarchyLevel',
    '*.colorName', '*.statusCategory.key', '*.statusCategory.id',
    // Raw transition ids; the display strings (fromString/toString) are kept,
    // and the long-format grain keeps these verbatim.
    'issues[].changelog.histories[].items[].from',
    'issues[].changelog.histories[].items[].to',
    'issues[].changelog.histories[].id',
    // Per-change timestamp: summarised to first/last/date in the wide grain,
    // preserved in full as `change.at` in the relational grain.
    'issues[].changelog.histories[].created',
    'issues[].changelog.startAt', 'issues[].changelog.maxResults',
    // Author identity is carried as a display name; the internal handles are not.
    'issues[].changelog.histories[].author.key',
    'issues[].changelog.histories[].author.name',
    'issues[].changelog.histories[].author.accountId',
    'issues[].changelog.histories[].author.emailAddress',
    // Long prose describing a status/priority/resolution, not the value itself.
    'issues[].fields.status.description',
    'issues[].fields.priority.description',
    'issues[].fields.resolution.description',
    'issues[].fields.issuetype.description',
    // Nested lookup ids for versions/components; names are kept.
    '*.components[].id', '*.fixVersions[].id', '*.versions[].id',
    '*.fixVersions[].archived', '*.fixVersions[].released',
    '*.versions[].archived', '*.versions[].released',
    '*.issuetype.id', '*.priority.id', '*.status.id', '*.resolution.id',
    '*.project.id', '*.project.projectTypeKey', '*.project.simplified',
    '*.watches.isWatching', '*.votes.hasVoted',
    // User identity is carried as displayName; the internal login handles are
    // not. Deliberately spelled out per-role rather than as a blanket `*.name`,
    // which would also license dropping status.name or component names.
    '*.creator.name', '*.creator.key', '*.creator.accountId',
    '*.reporter.name', '*.reporter.key', '*.reporter.accountId',
    '*.assignee.name', '*.assignee.accountId',
    '*.author.displayName.name',
    // Version-catalog attributes: properties of the release, not of the issue.
    '*.versions[].releaseDate', '*.fixVersions[].releaseDate',
    '*.versions[].description', '*.fixVersions[].description',
    '*.avatarId',
    // Linked issues are rendered as "is related to SPARK-1234 [Open] — summary".
    // The link's own numeric id, the link-type id, and the long prose
    // descriptions of the target's status/type are chrome around that.
    '*.issuelinks[].id', '*.issuelinks[].type.id', '*.issuelinks[].type.name',
    '*.issuelinks[].outwardIssue.id', '*.issuelinks[].inwardIssue.id',
    '*.issuelinks[].outwardIssue.fields.status.description',
    '*.issuelinks[].inwardIssue.fields.status.description',
    '*.issuelinks[].outwardIssue.fields.issuetype.description',
    '*.issuelinks[].inwardIssue.fields.issuetype.description',
    '*.issuelinks[].outwardIssue.fields.priority.name',
    '*.issuelinks[].inwardIssue.fields.priority.name',
    '*.issuelinks[].outwardIssue.fields.issuetype.name',
    '*.issuelinks[].inwardIssue.fields.issuetype.name',
    // The reciprocal phrase for the direction we did NOT render.
    '*.issuelinks[].type.inward', '*.issuelinks[].type.outward',
    // Component/version blurbs: catalogue prose, not issue data.
    '*.components[].description',
    // Internal handles and login names on any field object. The human label
    // (status.name, priority.name, project.name, a user's displayName) is what
    // reaches the sheet; `key`/`name` here are Jira's own identifiers.
    // The "human labels survive" test below keeps this honest — it asserts the
    // displayed values really are present, so this rule cannot hide a
    // regression that drops them.
    'issues[].fields.*.key',
    'issues[].fields.*.name',
    'issues[].fields.*.projectCategory',
    'issues[].fields.*.emailAddress',
    '*.statusCategory.name',
] as const;

export const jiraParser: PlatformParser<JiraSearchResponse> = {
    id: 'jira',
    label: 'Jira',
    detect: isJiraSearchResponse,
    transform: transformJiraSearch,
    intentionalOmissions: JIRA_OMISSIONS,
    guaranteedColumns: [
        'key',
        'summary',
        'status',
        'statusCategory',
        // Note: changelog.statusPath is deliberately NOT guaranteed. An issue
        // with no recorded status transition has no path, and dropEmptyColumns
        // correctly removes the column rather than showing an empty one — the
        // Apache Spark fixture is exactly that case.
        'changelog.log',
    ],
};
