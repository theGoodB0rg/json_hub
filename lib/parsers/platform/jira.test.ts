import { describe, it, expect } from '@jest/globals';
import { matchPlatform } from '@/lib/parsers/platform';
import {
    getJiraChangelogStatus,
    isJiraIssue,
    isJiraSearchResponse,
    transformJiraSearch,
} from '@/lib/parsers/platform/jira';

function issue(overrides = {}) {
    return {
        id: '10001',
        key: 'SPARK-1',
        self: 'https://jira.example.com/rest/api/2/issue/10001',
        fields: {
            summary: 'Test issue',
            status: { name: 'Open' },
        },
        ...overrides,
    };
}

function history(id: string, field = 'status') {
    return {
        id,
        author: { displayName: 'Alice' },
        created: '2026-10-01T10:00:00.000+0000',
        items: [{ field, fieldtype: 'jira', fromString: 'To Do', toString: 'Open' }],
    };
}

describe('Jira single-issue payloads', () => {
    it('detects a bare issue object (GET /rest/api/2/issue/KEY shape)', () => {
        expect(isJiraIssue(issue())).toBe(true);
        expect(isJiraSearchResponse(issue())).toBe(false);
    });

    it('rejects lookalikes: bare arrays and key-less objects stay generic', () => {
        expect(isJiraIssue([issue()])).toBe(false);
        expect(isJiraIssue({ key: 'X-1' })).toBe(false);
        expect(isJiraIssue({ fields: {} })).toBe(false);
        expect(isJiraIssue(null)).toBe(false);
    });

    it('routes a bare issue through the platform parser (flat grain)', () => {
        const match = matchPlatform(issue({ changelog: { histories: [history('1')] } }));
        expect(match?.parser.id).toBe('jira');
        expect(match?.rows).toHaveLength(1);
        expect(match?.rows[0].key).toBe('SPARK-1');
        expect(String(match?.rows[0]['changelog.log'] ?? '')).not.toBe('');
    });

    it('routes a bare issue through the relational grain (one row per change)', () => {
        const rows = transformJiraSearch(issue({ changelog: { histories: [history('1'), history('2')] } }) as any, 'relational');
        expect(rows).toHaveLength(2);
        expect(rows[0].key).toBe('SPARK-1');
    });

    it('handles a bare issue with no names map and no changelog', () => {
        const match = matchPlatform(issue());
        expect(match?.parser.id).toBe('jira');
        expect(match?.rows).toHaveLength(1);
        expect(match?.rows[0].summary).toBe('Test issue');
    });
});

describe('Jira changelog presence signal', () => {
    it('reports present when any issue carries changelog histories', () => {
        const data = { issues: [issue({ changelog: { histories: [history('1')] } }), issue()] };
        expect(getJiraChangelogStatus(data)).toBe('present');
    });

    it('reports empty when the changelog key exists but has no histories', () => {
        const data = { issues: [issue({ changelog: { histories: [] } })] };
        expect(getJiraChangelogStatus(data)).toBe('empty');
    });

    it('reports missing when no issue carries a changelog key', () => {
        expect(getJiraChangelogStatus({ issues: [issue(), issue()] })).toBe('missing');
    });

    it('reports missing for a bare issue without a changelog key', () => {
        expect(getJiraChangelogStatus(issue())).toBe('missing');
    });

    it('reports present for a bare issue with histories', () => {
        expect(getJiraChangelogStatus(issue({ changelog: { histories: [history('1')] } }))).toBe('present');
    });

    it('returns null for non-Jira payloads', () => {
        expect(getJiraChangelogStatus({ foo: 1 })).toBeNull();
        expect(getJiraChangelogStatus(null)).toBeNull();
        expect(getJiraChangelogStatus([{ key: 'X-1', fields: {} }])).toBeNull();
    });
});
