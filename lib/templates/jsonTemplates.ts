export interface JSONTemplate {
    id: string;
    name: string;
    description: string;
    category: 'api' | 'ecommerce' | 'analytics' | 'general';
    data: string;
}

export const JSON_TEMPLATES: JSONTemplate[] = [
    {
        id: 'user-api',
        name: 'User API Response',
        description: 'Typical user data from REST API',
        category: 'api',
        data: JSON.stringify({
            "users": [
                {
                    "id": 1,
                    "name": "John Doe",
                    "email": "john@example.com",
                    "address": {
                        "street": "123 Main St",
                        "city": "New York",
                        "zip": "10001"
                    },
                    "orders": [
                        { "orderId": "ORD-001", "total": 99.99 },
                        { "orderId": "ORD-002", "total": 149.50 }
                    ]
                },
                {
                    "id": 2,
                    "name": "Jane Smith",
                    "email": "jane@example.com",
                    "address": {
                        "street": "456 Oak Ave",
                        "city": "Los Angeles",
                        "zip": "90001"
                    },
                    "orders": [
                        { "orderId": "ORD-003", "total": 299.99 }
                    ]
                }
            ]
        }, null, 2)
    },
    {
        id: 'ecommerce-products',
        name: 'E-commerce Products',
        description: 'Product catalog with variants',
        category: 'ecommerce',
        data: JSON.stringify({
            "products": [
                {
                    "sku": "TSHIRT-001",
                    "name": "Classic T-Shirt",
                    "price": 29.99,
                    "category": "Apparel",
                    "tags": ["cotton", "casual", "bestseller"],
                    "variants": [
                        { "size": "S", "color": "Blue", "stock": 15 },
                        { "size": "M", "color": "Blue", "stock": 23 },
                        { "size": "L", "color": "Red", "stock": 8 }
                    ]
                },
                {
                    "sku": "SHOE-002",
                    "name": "Running Shoes",
                    "price": 89.99,
                    "category": "Footwear",
                    "tags": ["sports", "running", "comfort"],
                    "variants": [
                        { "size": "9", "color": "Black", "stock": 12 },
                        { "size": "10", "color": "White", "stock": 7 }
                    ]
                }
            ]
        }, null, 2)
    },
    {
        id: 'analytics-events',
        name: 'Analytics Events',
        description: 'User activity tracking data',
        category: 'analytics',
        data: JSON.stringify({
            "events": [
                {
                    "eventId": "evt_001",
                    "userId": "user_123",
                    "eventType": "page_view",
                    "timestamp": "2024-01-10T14:30:00Z",
                    "properties": {
                        "page": "/products",
                        "referrer": "google.com",
                        "device": "mobile"
                    }
                },
                {
                    "eventId": "evt_002",
                    "userId": "user_123",
                    "eventType": "add_to_cart",
                    "timestamp": "2024-01-10T14:32:15Z",
                    "properties": {
                        "productId": "TSHIRT-001",
                        "quantity": 2,
                        "price": 29.99
                    }
                },
                {
                    "eventId": "evt_003",
                    "userId": "user_456",
                    "eventType": "purchase",
                    "timestamp": "2024-01-10T14:35:00Z",
                    "properties": {
                        "orderId": "ORD-789",
                        "total": 149.99,
                        "items": 3
                    }
                }
            ]
        }, null, 2)
    },
    {
        id: 'simple-contacts',
        name: 'Contact List',
        description: 'Simple contact information',
        category: 'general',
        data: JSON.stringify([
            {
                "name": "Alice Johnson",
                "phone": "+1-555-0101",
                "email": "alice@company.com",
                "department": "Engineering"
            },
            {
                "name": "Bob Williams",
                "phone": "+1-555-0102",
                "email": "bob@company.com",
                "department": "Sales"
            },
            {
                "name": "Carol Martinez",
                "phone": "+1-555-0103",
                "email": "carol@company.com",
                "department": "Marketing"
            }
        ], null, 2)
    },
    {
        id: 'nested-config',
        name: 'Nested Configuration',
        description: 'Complex nested settings object',
        category: 'general',
        data: JSON.stringify({
            "app": {
                "name": "MyApp",
                "version": "2.1.0",
                "settings": {
                    "theme": "dark",
                    "notifications": {
                        "email": true,
                        "push": false,
                        "frequency": "daily"
                    },
                    "features": {
                        "analytics": true,
                        "beta": false,
                        "experimental": ["feature-a", "feature-b"]
                    }
                }
            },
            "database": {
                "host": "localhost",
                "port": 5432,
                "credentials": {
                    "username": "admin",
                    "encrypted": true
                }
            }
        }, null, 2)
    }
];
