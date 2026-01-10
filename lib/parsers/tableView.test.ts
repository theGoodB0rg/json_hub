import { expandToTableView, jsonToTableViewStructure } from './tableView';

describe('expandToTableView', () => {
    it('should handle null or undefined input', () => {
        expect(expandToTableView(null)).toEqual({ rows: [], schema: [] });
        expect(expandToTableView(undefined)).toEqual({ rows: [], schema: [] });
    });

    it('should handle empty array', () => {
        expect(expandToTableView([])).toEqual({ rows: [], schema: [] });
    });

    it('should expand single object with nested array', () => {
        const input = {
            sku: 'TSHIRT-001',
            name: 'Classic T-Shirt',
            variants: [
                { size: 'S', color: 'Blue' },
                { size: 'M', color: 'Red' }
            ]
        };

        const result = expandToTableView(input);

        expect(result.rows).toHaveLength(2);
        // Clean column names - no prefixes
        expect(result.rows[0]).toMatchObject({
            sku: 'TSHIRT-001',
            name: 'Classic T-Shirt',
            'size': 'S',
            'color': 'Blue'
        });
        expect(result.rows[1]).toMatchObject({
            sku: 'TSHIRT-001',
            name: 'Classic T-Shirt',
            'size': 'M',
            'color': 'Red'
        });
    });

    it('should format primitive arrays as comma-separated values', () => {
        const input = {
            sku: 'TSHIRT-001',
            tags: ['cotton', 'casual', 'bestseller']
        };

        const result = expandToTableView(input);

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toMatchObject({
            sku: 'TSHIRT-001',
            tags: 'cotton, casual, bestseller'
        });
    });

    it('should handle multi-level nested arrays', () => {
        const input = {
            products: [
                {
                    sku: 'TSHIRT-001',
                    variants: [
                        { size: 'S', stock: 10 },
                        { size: 'M', stock: 20 }
                    ]
                },
                {
                    sku: 'SHOE-002',
                    variants: [
                        { size: '9', stock: 15 }
                    ]
                }
            ]
        };

        const result = expandToTableView(input);

        expect(result.rows).toHaveLength(3);

        expect(result.rows[0]).toMatchObject({
            'products.sku': 'TSHIRT-001',
            'products.variants.size': 'S',
            'products.variants.stock': 10
        });

        expect(result.rows[1]).toMatchObject({
            'products.sku': 'TSHIRT-001',
            'products.variants.size': 'M',
            'products.variants.stock': 20
        });

        expect(result.rows[2]).toMatchObject({
            'products.sku': 'SHOE-002',
            'products.variants.size': '9',
            'products.variants.stock': 15
        });
    });

    it('should handle empty nested arrays', () => {
        const input = {
            sku: 'TSHIRT-001',
            variants: []
        };

        const result = expandToTableView(input);

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toMatchObject({
            sku: 'TSHIRT-001',
            variants: null
        });
    });

    it('should handle complex example from jsontotable.org', () => {
        const input = {
            products: [
                {
                    sku: 'TSHIRT-001',
                    name: 'Classic T-Shirt',
                    price: 29.99,
                    category: 'Apparel',
                    tags: ['cotton', 'casual', 'bestseller'],
                    variants: [
                        { size: 'S', color: 'Blue', stock: 15 },
                        { size: 'M', color: 'Blue', stock: 23 },
                        { size: 'L', color: 'Red', stock: 8 }
                    ]
                },
                {
                    sku: 'SHOE-002',
                    name: 'Running Shoes',
                    price: 89.99,
                    category: 'Footwear',
                    tags: ['sports', 'running', 'comfort'],
                    variants: [
                        { size: '9', color: 'Black', stock: 12 },
                        { size: '10', color: 'White', stock: 7 }
                    ]
                }
            ]
        };

        const result = expandToTableView(input);

        // Should have 5 rows total (3 variants for first product, 2 for second)
        expect(result.rows).toHaveLength(5);

        // Check first product's first variant
        expect(result.rows[0]).toMatchObject({
            'products.sku': 'TSHIRT-001',
            'products.name': 'Classic T-Shirt',
            'products.price': 29.99,
            'products.category': 'Apparel',
            'products.tags': 'cotton, casual, bestseller',
            'products.variants.size': 'S',
            'products.variants.color': 'Blue',
            'products.variants.stock': 15
        });

        // Check second product's first variant
        expect(result.rows[3]).toMatchObject({
            'products.sku': 'SHOE-002',
            'products.name': 'Running Shoes',
            'products.price': 89.99,
            'products.tags': 'sports, running, comfort',
            'products.variants.size': '9',
            'products.variants.color': 'Black',
            'products.variants.stock': 12
        });
    });

    it('should handle objects without arrays', () => {
        const input = {
            id: 1,
            name: 'John',
            address: {
                street: '123 Main St',
                city: 'New York'
            }
        };

        const result = expandToTableView(input);

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toMatchObject({
            id: 1,
            name: 'John',
            'address.street': '123 Main St',
            'address.city': 'New York'
        });
    });

    it('should normalize all rows to have all columns', () => {
        const input = [
            { a: 1, b: 2 },
            { a: 3, c: 4 }
        ];

        const result = expandToTableView(input);

        expect(result.rows).toHaveLength(2);
        expect(result.rows[0]).toHaveProperty('c');
        expect(result.rows[0].c).toBeNull();
        expect(result.rows[1]).toHaveProperty('b');
        expect(result.rows[1].b).toBeNull();
    });
});

describe('jsonToTableViewStructure', () => {
    it('should identify nested table cells', () => {
        const input = [
            {
                sku: 'TSHIRT-001',
                variants: [
                    { size: 'S', color: 'Blue' },
                    { size: 'M', color: 'Red' }
                ]
            }
        ];

        const result = jsonToTableViewStructure(input);

        expect(result.headers).toEqual(['sku', 'variants']);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].sku).toEqual({ type: 'primitive', value: 'TSHIRT-001' });
        expect(result.rows[0].variants).toEqual({
            type: 'table',
            tableData: {
                headers: ['size', 'color'],
                rows: [
                    { size: 'S', color: 'Blue' },
                    { size: 'M', color: 'Red' }
                ]
            }
        });
    });

    it('should handle primitive arrays in structure', () => {
        const input = [
            {
                sku: 'TSHIRT-001',
                tags: ['cotton', 'casual']
            }
        ];

        const result = jsonToTableViewStructure(input);

        expect(result.rows[0].tags).toEqual({
            type: 'primitive',
            value: 'cotton, casual'
        });
    });
});
