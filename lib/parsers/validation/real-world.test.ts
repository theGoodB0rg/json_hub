/**
 * Conversion correctness against real third-party payloads.
 *
 * Every fixture under tests/fixtures/real-world was fetched from a live public
 * API, not hand-written:
 *
 *   jira-apache-kafka.json      issues.apache.org  KAFKA, expand=changelog,names
 *   jira-apache-spark.json      issues.apache.org  SPARK, expand=changelog,names
 *   trello-public-roadmap.json  trello.com/b/nC8QJJoZ.json (Trello's own board)
 *   github-issues.json          api.github.com     facebook/react closed issues
 *   github-commits.json         api.github.com     microsoft/vscode commits
 *   coingecko.json              api.coingecko.com  markets, sparkline=true
 *   openlibrary.json            openlibrary.org    search.json
 *
 * Hand-written fixtures encode what we expect the world to look like. These
 * encode what it actually looks like: 125 field slots of which 31 are
 * populated, changelogs of 44 histories, boards whose cards carry attachments
 * nobody remembered to map. Two defects in this repo were found by running
 * the invariants below over this data rather than by reading the code —
 * Trello attachments vanishing, and Jira's statusCategory being dropped.
 */

import fs from 'fs';
import path from 'path';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import { PLATFORM_PARSERS, detectPlatform } from '@/lib/parsers/platform';
import {
    checkAll,
    checkLossless,
    checkNoCorruption,
    checkRectangular,
    formatViolations,
} from './invariants';

const FIXTURE_DIR = path.join(process.cwd(), 'tests/fixtures/real-world');

function load(name: string): any {
    return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8'));
}

/** The pipeline every caller in the app uses: unwrap, then flatten. */
function convert(raw: any, mode: 'flat' | 'relational' = 'flat') {
    return flattenJSON(smartUnwrap(raw, mode).data, { mode }).rows;
}

function omissionsFor(platform: string | null): readonly string[] {
    if (!platform) return [];
    return PLATFORM_PARSERS.find((p) => p.id === platform)?.intentionalOmissions ?? [];
}

interface Case {
    file: string;
    platform: string | null;
    /** Rows the flat grain must produce. */
    expectedRows: number;
    minFillRate?: number;
    /** Extra omissions inherent to the generic path, not to a parser. */
    extraOmissions?: readonly string[];
}

/**
 * `smartUnwrap` lifts the payload's main array out of its envelope, so the
 * envelope's own counters are not carried onto the rows. That is deliberate
 * and applies to every wrapped generic payload, not to one parser.
 */
const ENVELOPE_OMISSIONS = [
    'numFound', 'num_found', 'numFoundExact', 'start', 'offset',
    'documentation_url', 'q', 'total', 'count',
] as const;

const CASES: Case[] = [
    { file: 'jira-apache-kafka.json', platform: 'jira', expectedRows: 5 },
    { file: 'jira-apache-spark.json', platform: 'jira', expectedRows: 8 },
    { file: 'trello-public-roadmap.json', platform: 'trello', expectedRows: 60 },
    { file: 'github-issues.json', platform: null, expectedRows: 10, minFillRate: 0.4 },
    { file: 'github-commits.json', platform: null, expectedRows: 10, minFillRate: 0.4 },
    { file: 'coingecko.json', platform: null, expectedRows: 20 },
    {
        file: 'openlibrary.json',
        platform: null,
        expectedRows: 20,
        minFillRate: 0.4,
        extraOmissions: ENVELOPE_OMISSIONS,
    },
];

describe.each(CASES)('real-world payload: $file', (testCase) => {
    const raw = load(testCase.file);

    it('is routed to the expected parser', () => {
        expect(detectPlatform(raw)).toBe(testCase.platform);
    });

    it('satisfies every conversion invariant', () => {
        const violations = checkAll(raw, () => convert(raw, 'flat'), {
            expectedRows: testCase.expectedRows,
            minFillRate: testCase.minFillRate ?? 0.5,
            allowedOmissions: [
                ...omissionsFor(testCase.platform),
                ...(testCase.extraOmissions ?? []),
            ],
            // A platform parser's two grains are two views of one export, and
            // the product ships both. Detail condensed in the wide grain is
            // kept verbatim in the long grain, so losslessness is judged
            // across the pair rather than against either half.
            alsoPresentIn: testCase.platform ? [convert(raw, 'relational')] : [],
        });

        if (violations.length > 0) {
            throw new Error(`${testCase.file}\n${formatViolations(violations)}`);
        }
        expect(violations).toHaveLength(0);
    });

    it('emits every column its parser guarantees', () => {
        if (!testCase.platform) return;
        const parser = PLATFORM_PARSERS.find((p) => p.id === testCase.platform)!;
        const columns = new Set(Object.keys(convert(raw, 'flat')[0] ?? {}));
        for (const col of parser.guaranteedColumns ?? []) {
            expect(columns.has(col)).toBe(true);
        }
    });
});

describe('Jira changelog — the "Missing changelog" reports', () => {
    const raw = load('jira-apache-kafka.json');

    it('does not bury the changelog in hundreds of indexed columns', () => {
        const rows = convert(raw, 'flat');
        const columns = Object.keys(rows[0]);
        const changelogColumns = columns.filter((c) => c.startsWith('changelog'));

        // The generic flattener produced 575 changelog columns for these very
        // 5 issues (one set per history index, 41% filled). That output is
        // what four users read as "missing changelog".
        expect(changelogColumns.length).toBeLessThan(25);
        expect(columns.length).toBeLessThan(100);
    });

    it('renders status transitions as readable text, not JSON', () => {
        const rows = convert(raw, 'flat');
        const withStatus = rows.filter((r) => r['changelog.statusPath']);
        expect(withStatus.length).toBeGreaterThan(0);

        for (const row of withStatus) {
            const pathCell = String(row['changelog.statusPath']);
            expect(pathCell).toMatch(/→/);
            expect(pathCell).not.toMatch(/[{}[\]"]/);
        }
    });

    it('keeps a per-change audit line for every recorded change', () => {
        const rows = convert(raw, 'flat');
        for (const row of rows) {
            const entries = Number(row['changelog.entries']);
            if (!entries) continue;
            const logLines = String(row['changelog.log']).split('\n').filter(Boolean);
            expect(logLines).toHaveLength(entries);
        }
    });

    it('long-format grain emits exactly one row per change, with no Cartesian blow-up', () => {
        const long = convert(raw, 'relational');
        const wide = convert(raw, 'flat');

        const totalChanges = wide.reduce((sum, r) => sum + Number(r['changelog.entries'] || 0), 0);
        expect(totalChanges).toBeGreaterThan(50);
        expect(long).toHaveLength(totalChanges);

        // Relational used to emit the product of histories and items (194 rows
        // across 268 columns for 5 issues). Long format stays narrow.
        expect(Object.keys(long[0]).length).toBeLessThan(25);
    });

    it('derives cycle and lead time only when the issue actually got there', () => {
        const rows = convert(raw, 'flat');
        for (const row of rows) {
            const lead = row['changelog.leadTimeDays'];
            if (lead === null || lead === undefined || lead === '') continue;
            // Never negative, never a silent zero standing in for "unknown".
            expect(Number(lead)).toBeGreaterThan(0);
        }
    });

    it('human labels survive, despite the broad *.name omission rule', () => {
        // JIRA_OMISSIONS permits dropping `issues[].fields.*.name` because the
        // readable label reaches the sheet by another route. That rule is only
        // safe while this test holds: it pins the displayed values to the
        // source, so a regression that really loses them still fails.
        const rows = convert(raw, 'flat');
        raw.issues.forEach((issue: any, i: number) => {
            const f = issue.fields;
            const row = rows[i];
            expect(row.key).toBe(issue.key);
            if (f.status?.name) expect(row.status).toBe(f.status.name);
            if (f.priority?.name) expect(row.priority).toBe(f.priority.name);
            if (f.issuetype?.name) expect(row.issuetype).toBe(f.issuetype.name);
            if (f.project?.name) expect(row.project).toBe(f.project.name);
            if (f.resolution?.name) expect(row.resolution).toBe(f.resolution.name);
            if (f.assignee?.displayName) expect(row.assignee).toBe(f.assignee.displayName);
            if (f.status?.statusCategory?.name) {
                expect(row.statusCategory).toBe(f.status.statusCategory.name);
            }
            // Components and fix versions must be present by name, all of them.
            for (const c of f.components ?? []) {
                expect(String(row.components)).toContain(c.name);
            }
            for (const v of f.fixVersions ?? []) {
                expect(String(row.fixVersions)).toContain(v.name);
            }
        });
    });

    it('renders linked issues as a readable relationship, not numeric ids', () => {
        const rows = convert(raw, 'flat');
        raw.issues.forEach((issue: any, i: number) => {
            const links = issue.fields?.issuelinks ?? [];
            if (links.length === 0) return;
            const cell = String(rows[i].issuelinks ?? '');
            for (const link of links) {
                const target = link.outwardIssue || link.inwardIssue;
                if (!target?.key) continue;
                expect(cell).toContain(target.key);
            }
            // The old output was a list of bare link ids like "12310260".
            expect(cell).not.toMatch(/^\d+(,\s*\d+)*$/);
        });
    });

    it('resolves custom field ids to their human names', () => {
        const columns = Object.keys(convert(raw, 'flat')[0]);
        // The payload's `names` map carries "Global Rank" for customfield_12310420.
        expect(columns).toContain('Global Rank');
        expect(columns.some((c) => /^customfield_\d+$/.test(c))).toBe(false);
    });
});

describe('Trello — attachments and row duplication', () => {
    const raw = load('trello-public-roadmap.json');

    it('produces exactly one row per card', () => {
        expect(convert(raw, 'flat')).toHaveLength(raw.cards.length);
    });

    it('REGRESSION: card attachments are carried onto the row', () => {
        const rows = convert(raw, 'flat');
        const cardsWithAttachments = raw.cards.filter(
            (c: any) => Array.isArray(c.attachments) && c.attachments.length > 0
        );
        expect(cardsWithAttachments.length).toBeGreaterThan(0);

        for (const card of cardsWithAttachments) {
            const row = rows.find((r) => r.id === card.id);
            expect(row).toBeDefined();
            expect(Number(row!['attachments.count'])).toBe(card.attachments.length);

            // Every attachment that has a name must be findable in the cell.
            for (const att of card.attachments) {
                const label = att?.name || att?.fileName;
                if (!label) continue;
                expect(String(row!['attachments.names'])).toContain(label);
            }
        }
    });

    it('does not multiply cards by their checklists, labels or members', () => {
        const rows = convert(raw, 'flat');
        const ids = rows.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('generic flattener is lossless on unrecognised payloads', () => {
    // No platform parser claims these, so nothing is allowed to disappear:
    // the generic path has no licence to drop anything at all.
    it.each(['github-issues.json', 'github-commits.json', 'coingecko.json'])(
        '%s loses nothing',
        (file) => {
            const raw = load(file);
            const rows = convert(raw, 'flat');
            const violation = checkLossless(raw, rows, {});
            if (violation) throw new Error(formatViolations([violation]));
            expect(violation).toBeNull();
        }
    );

    it('keeps deeply nested numeric arrays intact (coingecko sparklines)', () => {
        const raw = load('coingecko.json');
        const rows = convert(raw, 'flat');
        const sparkCols = Object.keys(rows[0]).filter((c) => /sparkline/i.test(c));
        expect(sparkCols.length).toBeGreaterThan(0);
        // A 168-point price series must stay in one cell, not become 168 columns.
        expect(sparkCols.length).toBeLessThan(5);
    });

    it('never emits a mangled object or NaN cell', () => {
        for (const file of ['github-issues.json', 'github-commits.json', 'coingecko.json', 'openlibrary.json']) {
            const rows = convert(load(file), 'flat');
            expect(checkNoCorruption(rows)).toBeNull();
            expect(checkRectangular(rows)).toBeNull();
        }
    });
});

describe('platform detection does not claim payloads it does not own', () => {
    it.each(['github-issues.json', 'github-commits.json', 'coingecko.json', 'openlibrary.json'])(
        '%s falls through to the generic path',
        (file) => {
            expect(detectPlatform(load(file))).toBeNull();
        }
    );

    it('survives hostile and degenerate input without throwing', () => {
        const hostile: unknown[] = [
            null,
            undefined,
            0,
            '',
            'not json',
            [],
            {},
            { issues: [] },
            { issues: 'nope' },
            { issues: [null] },
            { issues: [{ key: 'X' }] }, // key but no fields — must not match Jira
            { cards: 'nope' },
            { cards: [], lists: [] },
            [{ key: 'A', fields: {} }], // bare array — not a search response
        ];
        for (const input of hostile) {
            expect(() => detectPlatform(input)).not.toThrow();
            expect(() => flattenJSON(input as any)).not.toThrow();
            expect(() => smartUnwrap(input as any)).not.toThrow();
        }
    });

    it('does not reshape a plain array of objects that happens to have `key`', () => {
        const data = [
            { key: 'a', fields: { x: 1 } },
            { key: 'b', fields: { x: 2 } },
        ];
        expect(detectPlatform(data)).toBeNull();
        const rows = flattenJSON(data).rows;
        expect(rows).toHaveLength(2);
        expect(rows[0]['fields.x']).toBe(1);
    });
});
