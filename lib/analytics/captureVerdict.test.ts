import { captureVerdict, sourcesDisagreeOnPillar1 } from './captureVerdict';

describe('capture-rate verdict', () => {
    it('flags a large edge/RUM disagreement even when RUM volume is low', () => {
        // Nov 2026: 3,072 human-looking edge pageviews against 48 in CF RUM.
        expect(sourcesDisagreeOnPillar1(48, 3072, true)).toBe(true);
    });

    it('ignores small windows on both sides', () => {
        expect(sourcesDisagreeOnPillar1(10, 40, true)).toBe(false);
    });

    it('ignores windows dominated by pre-fix rows', () => {
        expect(sourcesDisagreeOnPillar1(48, 3072, false)).toBe(false);
    });

    it('accepts sources that agree', () => {
        expect(sourcesDisagreeOnPillar1(100, 120, true)).toBe(false);
    });

    it('gives no health verdict when the sources disagree', () => {
        expect(captureVerdict(48, 61, 61 / 48, true)).toBe('unknown');
    });

    it('judges Pillar 2 when the sources agree', () => {
        expect(captureVerdict(100, 80, 0.8, false)).toBe('healthy');
        expect(captureVerdict(100, 50, 0.5, false)).toBe('degraded');
    });
});
