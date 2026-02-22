export interface DummyDataset {
    slug: string;
    platform: string;
    title: string;
    description: string;
    data: any;
    converterSlug: string; // The URL slug to link them back to the tool
}

export const dummyDatasets: DummyDataset[] = [
    {
        slug: 'stripe-invoice-json-example',
        platform: 'Stripe',
        title: 'Mock Stripe Invoice JSON Example',
        description: 'A deeply nested mock Stripe invoice dataset featuring complex metadata objects, line items, and nested discounts, perfect for testing ETL pipelines or JSON tabular tools.',
        converterSlug: 'stripe-json-to-excel',
        data: {
            "object": "list",
            "url": "/v1/invoices",
            "has_more": false,
            "data": [
                {
                    "id": "in_1TestInv123",
                    "object": "invoice",
                    "account_country": "US",
                    "account_name": "Test Company LLC",
                    "amount_due": 5000,
                    "amount_paid": 5000,
                    "amount_remaining": 0,
                    "created": 1672531200,
                    "currency": "usd",
                    "customer": "cus_12345",
                    "customer_email": "test@example.com",
                    "customer_name": "Jane Doe",
                    "metadata": {
                        "internal_id": "89012",
                        "referral_source": "google_ads",
                        "utm_campaign": "spring_sale"
                    },
                    "lines": {
                        "object": "list",
                        "data": [
                            {
                                "id": "il_1TestLine1",
                                "object": "line_item",
                                "amount": 5000,
                                "currency": "usd",
                                "description": "Premium Subscription (Yearly)",
                                "price": {
                                    "id": "price_1TestPrice",
                                    "product": "prod_1Test",
                                    "unit_amount": 5000
                                },
                                "quantity": 1
                            }
                        ]
                    },
                    "status": "paid",
                    "total": 5000
                },
                {
                    "id": "in_1TestInvABC",
                    "object": "invoice",
                    "amount_due": 1250,
                    "amount_paid": 1250,
                    "currency": "usd",
                    "customer": "cus_67890",
                    "metadata": {
                        "internal_id": "89020",
                        "referral_source": "organic",
                        "utm_campaign": "none"
                    },
                    "lines": {
                        "data": [
                            {
                                "amount": 1250,
                                "description": "Basic Plan (Monthly)",
                                "quantity": 1
                            }
                        ]
                    },
                    "status": "paid",
                    "total": 1250
                }
            ]
        }
    },
    {
        slug: 'salesforce-account-export-mock',
        platform: 'Salesforce',
        title: 'Mock Salesforce Account Export JSON',
        description: 'A mock JSON payload simulating a Salesforce REST API response for Accounts, including sub-queries for Contacts and Opportunities.',
        converterSlug: 'salesforce-json-to-excel',
        data: {
            "totalSize": 2,
            "done": true,
            "records": [
                {
                    "attributes": {
                        "type": "Account",
                        "url": "/services/data/v58.0/sobjects/Account/001XXX0000001"
                    },
                    "Id": "001XXX0000001",
                    "Name": "Acme Corp",
                    "Industry": "Manufacturing",
                    "AnnualRevenue": 50000000,
                    "Contacts": {
                        "totalSize": 2,
                        "done": true,
                        "records": [
                            {
                                "attributes": {
                                    "type": "Contact",
                                    "url": "/services/data/v58.0/sobjects/Contact/003XXX0000001"
                                },
                                "Id": "003XXX0000001",
                                "FirstName": "John",
                                "LastName": "Smith",
                                "Title": "CEO"
                            }
                        ]
                    },
                    "Opportunities": {
                        "totalSize": 1,
                        "done": true,
                        "records": [
                            {
                                "attributes": {
                                    "type": "Opportunity",
                                    "url": "/services/data/v58.0/sobjects/Opportunity/006XXX0000001"
                                },
                                "Id": "006XXX0000001",
                                "Name": "Acme Q3 Order",
                                "StageName": "Closed Won",
                                "Amount": 150000
                            }
                        ]
                    }
                }
            ]
        }
    },
    {
        slug: 'shopify-line-items-json',
        platform: 'Shopify',
        title: 'Mock Shopify Order JSON with Line Items',
        description: 'A sample Shopify order JSON payload containing deeply nested line_items, tax_lines, and discount_applications.',
        converterSlug: 'shopify-json-to-csv',
        data: {
            "orders": [
                {
                    "id": 450789469,
                    "email": "customer@example.com",
                    "created_at": "2024-02-15T10:00:00-04:00",
                    "total_price": "135.00",
                    "subtotal_price": "120.00",
                    "total_tax": "15.00",
                    "currency": "USD",
                    "line_items": [
                        {
                            "id": 12345678,
                            "title": "Minimalist Ceramic Mug",
                            "quantity": 4,
                            "price": "20.00",
                            "sku": "MUG-CER-WHT",
                            "properties": [
                                { "name": "Color", "value": "White" },
                                { "name": "Gift Wrap", "value": "No" }
                            ]
                        },
                        {
                            "id": 12345679,
                            "title": "Artisan Coffee Beans",
                            "quantity": 2,
                            "price": "20.00",
                            "sku": "COF-ART-500",
                            "properties": []
                        }
                    ],
                    "tax_lines": [
                        {
                            "title": "State Tax",
                            "price": "10.00",
                            "rate": 0.083
                        },
                        {
                            "title": "County Tax",
                            "price": "5.00",
                            "rate": 0.042
                        }
                    ],
                    "customer": {
                        "id": 567890,
                        "email": "customer@example.com",
                        "first_name": "Alice",
                        "last_name": "Baker",
                        "orders_count": 3
                    }
                }
            ]
        }
    },
    {
        slug: 'complex-nested-json-example',
        platform: 'Generic',
        title: 'Highly Complex Nested JSON Dummy Dataset',
        description: 'A generic, incredibly messy JSON structure containing arrays of objects, objects containing arrays, missing keys, and diverse data types to test JSON flattening edge cases.',
        converterSlug: 'nested-arrays-to-excel',
        data: [
            {
                "id": "REC-001",
                "timestamp": "2024-01-01T00:00:00Z",
                "user": {
                    "profile": {
                        "name": "Admin User",
                        "settings": {
                            "theme": "dark",
                            "notifications": ["email", "sms"]
                        }
                    }
                },
                "events": [
                    { "type": "login", "ip": "192.168.1.1" },
                    { "type": "click", "element": "btn_submit", "duration_ms": 120 }
                ]
            },
            {
                "id": "REC-002",
                "timestamp": "2024-01-02T00:00:00Z",
                "user": {
                    "profile": null
                },
                "events": [],
                "anomalies": {
                    "code": 404,
                    "details": "[object Object]",
                    "trace": null
                }
            }
        ]
    }
];
