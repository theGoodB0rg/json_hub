import { PLATFORM_SAMPLES } from './platform-samples';
import { validateAndParse } from '@/lib/parsers/smartParse';
import { flattenJSON } from '@/lib/parsers/flattener';

describe('Authentic Platform Transforms & Flattening', () => {
    Object.entries(PLATFORM_SAMPLES).forEach(([platformKey, sample]) => {
        describe(`Platform: ${sample.platform}`, () => {
            it('parses valid platform sample JSON without errors', () => {
                const parseResult = validateAndParse(sample.sampleJson);
                expect(parseResult.success).toBe(true);
                expect(parseResult.errors).toBeUndefined();
                expect(parseResult.data).not.toBeNull();
            });

            it('flattens authentic platform structures without producing [object Object] values', () => {
                const parseResult = validateAndParse(sample.sampleJson);
                expect(parseResult.success).toBe(true);
                const { rows, schema } = flattenJSON(parseResult.data);

                expect(rows.length).toBeGreaterThan(0);
                expect(schema.length).toBeGreaterThan(0);

                // Ensure no values are the raw string '[object Object]'
                rows.forEach((row) => {
                    Object.entries(row).forEach(([key, val]) => {
                        expect(val).not.toBe('[object Object]');
                    });
                });
            });
        });
    });
});
