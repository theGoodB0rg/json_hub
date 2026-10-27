import { lastModifiedFor, resetLastmodCache, LASTMOD_FALLBACK } from './lastmod';

beforeEach(() => resetLastmodCache());

describe('lastModifiedFor', () => {
    it('returns the newest commit date across the files', () => {
        const dates: Record<string, string> = {
            'a.ts': '2026-10-01T10:00:00+00:00',
            'b.ts': '2026-10-20T22:05:23+01:00',
        };
        const run = (args: string[]) => dates[args[args.length - 1]];
        expect(lastModifiedFor(['a.ts', 'b.ts'], undefined, run).toISOString()).toBe('2026-10-20T21:05:23.000Z');
    });

    it('falls back to a fixed date, never "now", when git has no history', () => {
        const run = () => '';
        expect(lastModifiedFor(['new.ts'], undefined, run)).toBe(LASTMOD_FALLBACK);
    });

    it('falls back when git is unavailable', () => {
        const run = () => {
            throw new Error('git not found');
        };
        const custom = new Date('2026-05-05T00:00:00Z');
        expect(lastModifiedFor(['x.ts'], custom, run)).toBe(custom);
    });

    it('ignores unparseable output', () => {
        const run = () => 'not a date';
        expect(lastModifiedFor(['x.ts'], undefined, run)).toBe(LASTMOD_FALLBACK);
    });

    it('uses the files that do have history when only some do', () => {
        const run = (args: string[]) => (args[args.length - 1] === 'known.ts' ? '2026-09-09T00:00:00Z' : '');
        expect(lastModifiedFor(['known.ts', 'unknown.ts'], undefined, run).toISOString()).toBe('2026-09-09T00:00:00.000Z');
    });

    it('asks git once per path', () => {
        const run = jest.fn(() => '2026-09-09T00:00:00Z');
        lastModifiedFor(['same.ts'], undefined, run);
        lastModifiedFor(['same.ts'], undefined, run);
        expect(run).toHaveBeenCalledTimes(1);
    });
});
