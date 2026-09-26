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

        it('should serialize arrays of primitives as JSON strings', () => {
            const input = {
                items: ['apple', 'banana', 'cherry'],
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toEqual({
                items: 'apple, banana, cherry',
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
                array: '1, 2, 3', // Now serialized as comma separated
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

        it('should handle GeoJSON coordinates intelligently', () => {
            const geojson = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {
                            location: 'Central Park',
                            areaCode: 212,
                            amenities: {
                                restrooms: true,
                                food: true,
                            },
                        },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [-73.981, 40.768],
                                    [-73.958, 40.8],
                                    [-73.949, 40.796],
                                    [-73.973, 40.764],
                                    [-73.981, 40.768],
                                ],
                            ],
                        },
                    },
                ],
            };

            const result = flattenJSON(geojson);

            // Should create a manageable number of columns (not 17!)
            expect(result.schema.length).toBeLessThan(12);

            // Coordinates should be serialized as JSON string
            expect(result.rows[0]['features.0.geometry.coordinates']).toContain('[');
            expect(typeof result.rows[0]['features.0.geometry.coordinates']).toBe('string');

            // Regular properties should still be flattened
            expect(result.rows[0]['features.0.properties.location']).toBe('Central Park');
            expect(result.rows[0]['features.0.properties.areaCode']).toBe(212);
        });

        it('should serialize nested arrays', () => {
            const input = {
                matrix: [
                    [1, 2, 3],
                    [4, 5, 6],
                ],
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].matrix).toBe('[[1,2,3],[4,5,6]]');
        });

        it('should expand arrays of objects but serialize their primitive arrays', () => {
            const input = {
                users: [
                    { name: 'John', tags: ['admin', 'user'] },
                    { name: 'Jane', tags: ['user'] },
                ],
            };
            const result = flattenJSON(input);

            expect(result.rows).toHaveLength(1);
            // Users array should be expanded
            expect(result.rows[0]['users.0.name']).toBe('John');
            expect(result.rows[0]['users.1.name']).toBe('Jane');
            // But tags (primitive arrays) should be serialized
            expect(result.rows[0]['users.0.tags']).toBe('admin, user');
            expect(result.rows[0]['users.1.tags']).toBe('user');
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

            // Since we now format primitive arrays as strings, the roundtrip will result in a string
            const expected = {
                ...original,
                items: 'apple, banana',
            };

            expect(unflattened).toEqual(expected);
        });
    });

    describe('Trello & Sibling Array Deduplication', () => {
        it('should transform a Trello board with multiple cards, checklists, and labels without duplicating rows', () => {
            const trelloBoard = {
                id: 'board_123',
                name: 'Product Roadmap',
                lists: [
                    { id: 'list_backlog', name: 'Backlog' },
                    { id: 'list_in_progress', name: 'In Progress' }
                ],
                customFields: [
                    {
                        id: 'cf_priority',
                        name: 'Priority Level',
                        type: 'text'
                    }
                ],
                cards: [
                    {
                        id: 'card_1',
                        name: 'Setup CI/CD Pipeline',
                        idList: 'list_in_progress',
                        labels: [
                            { id: 'l1', name: 'DevOps', color: 'blue' },
                            { id: 'l2', name: 'High Priority', color: 'red' }
                        ],
                        checklists: [
                            {
                                id: 'chk_1',
                                name: 'Steps',
                                checkItems: [
                                    { id: 'i1', name: 'Dockerize app', state: 'complete' },
                                    { id: 'i2', name: 'Setup GitHub Actions', state: 'complete' }
                                ]
                            },
                            {
                                id: 'chk_2',
                                name: 'Testing',
                                checkItems: [
                                    { id: 'i3', name: 'Run E2E tests', state: 'incomplete' }
                                ]
                            }
                        ],
                        members: [
                            { id: 'm1', fullName: 'Sarah Connor' },
                            { id: 'm2', fullName: 'John Doe' }
                        ],
                        customFieldItems: [
                            { idCustomField: 'cf_priority', value: { text: 'Critical' } }
                        ],
                        pluginData: [
                            {
                                id: 'pd_1',
                                idPlugin: 'time_tracker',
                                value: JSON.stringify({ estimateHours: 16, spentHours: 8 })
                            }
                        ]
                    },
                    {
                        id: 'card_2',
                        name: 'Write Documentation',
                        idList: 'list_backlog',
                        labels: [],
                        checklists: [],
                        members: []
                    }
                ]
            };

            const result = flattenJSON(trelloBoard);

            // Exactly 2 cards must result in exactly 2 rows (Zero duplication)
            expect(result.rows).toHaveLength(2);

            const card1 = result.rows.find(r => r.name === 'Setup CI/CD Pipeline');
            expect(card1).toBeDefined();
            // List name resolved
            expect(card1.listName).toBe('In Progress');
            // Custom field resolved as first-class column
            expect(card1.custom_Priority_Level).toBe('Critical');
            // Plugin data parsed
            expect(card1.plugin_time_tracker_estimateHours).toBe(16);
            expect(card1.plugin_time_tracker_spentHours).toBe(8);
            // Checklists summarized
            expect(card1.checklistProgress).toBe('2/3');
            // Members joined
            expect(card1.assignedMembers).toContain('Sarah Connor');
            expect(card1.assignedMembers).toContain('John Doe');
        });

        it('should prevent combinatorial row explosion when an object has multiple sibling object arrays in relational mode', () => {
            const data = {
                id: 'entity_1',
                name: 'Parent Entity',
                items: [
                    { id: 'item_1', val: 10 },
                    { id: 'item_2', val: 20 },
                    { id: 'item_3', val: 30 }
                ],
                tags: [
                    { tagId: 't1', label: 'Tag 1' },
                    { tagId: 't2', label: 'Tag 2' }
                ]
            };

            // In relational mode, expanding sibling arrays geometrically would yield 3 * 2 = 6 rows.
            // With combinatorial safeguard, the primary array (items) expands into 3 rows,
            // while sibling tags array is cleanly serialized without creating phantom duplicate parent rows.
            const result = flattenJSON(data, { mode: 'relational' });
            expect(result.rows).toHaveLength(3);
        });
    });
});

