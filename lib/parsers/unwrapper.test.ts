
import { smartUnwrap } from './unwrapper';

describe('smartUnwrap', () => {
    it('should pass through arrays', () => {
        const input = [{ a: 1 }];
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(false);
        expect(result.data).toBe(input);
    });

    it('should pass through primitives', () => {
        expect(smartUnwrap(123).isUnwrapped).toBe(false);
        expect(smartUnwrap(null).isUnwrapped).toBe(false);
    });

    it('should unwrap GeoJSON features', () => {
        const input = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', geometry: {} },
                { type: 'Feature', geometry: {} },
            ]
        };
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data).toBe(input.features);
        expect(result.wrapperInfo).toEqual({ type: 'FeatureCollection' });
    });

    it('should unwrap wrapper with "data" key', () => {
        const input = {
            status: 'success',
            meta: { total: 100 },
            data: [1, 2, 3]
        };
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(true);
        expect(result.data).toEqual([1, 2, 3]);
        expect(result.wrapperInfo?.status).toBe('success');
    });

    it('should prefer common keys like "items"', () => {
        const input = {
            tags: ['a', 'b'], // random array
            items: [{ id: 1 }, { id: 2 }] // common key
        };
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(true);
        expect(result.data).toBe(input.items);
    });

    it('should pick largest array if no common keys', () => {
        const input = {
            other: [1],
            main: [1, 2, 3, 4, 5]
        };
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(true);
        expect(result.data).toBe(input.main);
    });

    it('should not unwrap empty array if not a common key', () => {
        const input = {
            name: 'test',
            values: [] // empty random array
        };
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(false);
    });

    // NEW: Tests for single-element array unwrapping (Salesforce-style envelopes)
    it('should unwrap single-element arrays containing wrapper objects', () => {
        // Salesforce-style envelope wrapped in array (as smartParse does)
        const input = [{
            totalSize: 4,
            done: true,
            records: [{ Id: '001', Name: 'Test' }, { Id: '002', Name: 'Test2' }]
        }];
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(true);
        expect(result.data).toEqual([{ Id: '001', Name: 'Test' }, { Id: '002', Name: 'Test2' }]);
        expect(result.wrapperInfo?.totalSize).toBe(4);
        expect(result.wrapperInfo?.done).toBe(true);
    });

    it('should handle deeply nested wrappers in single-element arrays', () => {
        const input = [{ data: [{ id: 1 }, { id: 2 }] }];
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(true);
        expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should NOT unwrap single-element arrays with non-wrapper objects', () => {
        // A single data object (not a wrapper) - should pass through
        const input = [{ id: 1, name: 'Test', email: 'test@example.com' }];
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(false);
        expect(result.data).toBe(input);
    });

    it('should handle multi-element arrays normally', () => {
        const input = [{ id: 1 }, { id: 2 }];
        const result = smartUnwrap(input);
        expect(result.isUnwrapped).toBe(false);
        expect(result.data).toBe(input);
    });
});
