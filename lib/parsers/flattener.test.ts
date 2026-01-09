import { flattenJSON, inferSchema, unflattenObject } from './flattener';

describe('flattener', () => {
    describe('flattenJSON', () => {
        it('should flatten a simple flat object', () => {
            const input = { name: 'John', age: 30, city: 'New York' };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toEqual({ name: 'John', age: 30, city: 'New York' });
            expect(result.schema).toEqual(['age', 'city', 'name']);
        });

        it('should flatten nested objects with dot notation', () => {
            const input = {
                user: {
                    name: 'John',
                    address: {
                        city: 'New York',
                        zip: '10001',
                    },
                },
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toEqual({
                'user.name': 'John',
                'user.address.city': 'New York',
                'user.address.zip': '10001',
            });
            expect(result.schema).toEqual([
                'user.address.city',
                'user.address.zip',
                'user.name',
            ]);
        });

        it('should handle arrays of objects', () => {
            const input = [
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 },
            ];
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(2);
            expect(result.rows[0]).toEqual({ name: 'John', age: 30 });
            expect(result.rows[1]).toEqual({ name: 'Jane', age: 25 });
        });

        it('should handle nested arrays with indexed columns', () => {
            const input = {
                items: ['apple', 'banana', 'cherry'],
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toEqual({
                'items.0': 'apple',
                'items.1': 'banana',
                'items.2': 'cherry',
            });
        });

        it('should handle arrays of nested objects', () => {
            const input = {
                users: [
                    { name: 'John', age: 30 },
                    { name: 'Jane', age: 25 },
                ],
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toEqual({
                'users.0.name': 'John',
                'users.0.age': 30,
                'users.1.name': 'Jane',
                'users.1.age': 25,
            });
        });

        it('should fill missing columns with null', () => {
            const input = [
                { name: 'John', age: 30, city: 'NYC' },
                { name: 'Jane', age: 25 }, // missing city
            ];
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(2);
            expect(result.rows[0]).toEqual({ name: 'John', age: 30, city: 'NYC' });
            expect(result.rows[1]).toEqual({ name: 'Jane', age: 25, city: null });
        });

        it('should handle deeply nested objects', () => {
            const input = {
                level1: {
                    level2: {
                        level3: {
                            level4: {
                                value: 'deep',
                            },
                        },
                    },
                },
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toEqual({
                'level1.level2.level3.level4.value': 'deep',
            });
        });

        it('should handle mixed data types', () => {
            const input = {
                string: 'text',
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3],
                object: { nested: 'value' },
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toMatchObject({
                string: 'text',
                number: 42,
                boolean: true,
                null: null,
                'array.0': 1,
                'array.1': 2,
                'array.2': 3,
                'object.nested': 'value',
            });
        });

        it('should handle empty array', () => {
            const result = flattenJSON([]);

            expect(result.rows).toHaveLength(0);
            expect(result.schema).toHaveLength(0);
        });

        it('should handle null input', () => {
            const result = flattenJSON(null);

            expect(result.rows).toHaveLength(0);
            expect(result.schema).toHaveLength(0);
        });

        it('should handle undefined input', () => {
            const result = flattenJSON(undefined);

            expect(result.rows).toHaveLength(0);
            expect(result.schema).toHaveLength(0);
        });

        it('should handle circular references', () => {
            const obj: any = { name: 'Test' };
            obj.self = obj;

            const result = flattenJSON(obj);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]['self']).toBe('[Circular Reference]');
        });

        it('should handle large datasets efficiently', () => {
            const largeArray = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                name: `User ${i}`,
                email: `user${i}@example.com`,
            }));

            const start = Date.now();
            const result = flattenJSON(largeArray);
            const duration = Date.now() - start;

            expect(result.rows).toHaveLength(1000);
            expect(duration).toBeLessThan(1000); // Should complete in < 1 second
        });

        it('should handle objects with special characters in keys', () => {
            const input = {
                'key-with-dash': 'value1',
                'key.with.dots': 'value2',
                'key with spaces': 'value3',
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toEqual({
                'key-with-dash': 'value1',
                'key.with.dots': 'value2',
                'key with spaces': 'value3',
            });
        });
    });

    describe('inferSchema', () => {
        it('should infer schema from array of objects', () => {
            const data = [
                { name: 'John', age: 30 },
                { name: 'Jane', city: 'NYC' },
                { name: 'Bob', age: 25, city: 'LA' },
            ];

            const schema = inferSchema(data);

            expect(schema).toEqual(['age', 'city', 'name']);
        });

        it('should limit sampling to specified size', () => {
            const data = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                [`field${i}`]: `value${i}`,
            }));

            const schema = inferSchema(data, 10);

            // Should only include fields from first 10 rows
            expect(schema.length).toBeLessThanOrEqual(20); // id + field0-9
        });

        it('should handle nested objects in schema inference', () => {
            const data = [
                { user: { name: 'John', age: 30 } },
                { user: { name: 'Jane', city: 'NYC' } },
            ];

            const schema = inferSchema(data);

            expect(schema).toContain('user.name');
            expect(schema).toContain('user.age');
            expect(schema).toContain('user.city');
        });
    });

    describe('unflattenObject', () => {
        it('should unflatten a simple flat object', () => {
            const flat = { name: 'John', age: 30 };
            const result = unflattenObject(flat);

            expect(result).toEqual({ name: 'John', age: 30 });
        });

        it('should unflatten nested objects', () => {
            const flat = {
                'user.name': 'John',
                'user.address.city': 'NYC',
                'user.address.zip': '10001',
            };
            const result = unflattenObject(flat);

            expect(result).toEqual({
                user: {
                    name: 'John',
                    address: {
                        city: 'NYC',
                        zip: '10001',
                    },
                },
            });
        });

        it('should unflatten arrays', () => {
            const flat = {
                'items.0': 'apple',
                'items.1': 'banana',
                'items.2': 'cherry',
            };
            const result = unflattenObject(flat);

            expect(result).toEqual({
                items: ['apple', 'banana', 'cherry'],
            });
        });

        it('should roundtrip flatten and unflatten', () => {
            const original = {
                user: {
                    name: 'John',
                    age: 30,
                    address: {
                        city: 'NYC',
                        zip: '10001',
                    },
                },
                items: ['apple', 'banana'],
            };

            const flattened = flattenJSON(original);
            const unflattened = unflattenObject(flattened.rows[0]);

            expect(unflattened).toEqual(original);
        });
    });
});
