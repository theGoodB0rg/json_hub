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
        slug: 'hubspot-contacts-deals-json',
        platform: 'HubSpot',
        title: 'Mock HubSpot CRM Contacts & Deals JSON',
        description: 'Authentic HubSpot CRM API payload with nested property dictionaries, deal stages, pipeline values, and association IDs for pipeline reporting.',
        converterSlug: 'hubspot-json-to-excel',
        data: {
            "results": [
                {
                    "id": "5129481",
                    "properties": {
                        "firstname": "Sarah",
                        "lastname": "Connor",
                        "email": "sconnor@cyberdyne.io",
                        "company": "Cyberdyne Systems",
                        "jobtitle": "VP of Engineering",
                        "lifecyclestage": "lead",
                        "hs_lead_status": "OPEN",
                        "annualrevenue": "25000000",
                        "createdate": "2026-03-12T14:23:10.000Z"
                    },
                    "associations": {
                        "deals": {
                            "results": [
                                { "id": "deal_9901", "type": "contact_to_deal" }
                            ]
                        }
                    }
                },
                {
                    "id": "5129482",
                    "properties": {
                        "firstname": "Marcus",
                        "lastname": "Wright",
                        "email": "mwright@skynet.com",
                        "company": "Skynet Defense",
                        "jobtitle": "Director of Infrastructure",
                        "lifecyclestage": "customer",
                        "hs_lead_status": "IN_PROGRESS",
                        "annualrevenue": "120000000",
                        "createdate": "2026-04-05T09:12:44.000Z"
                    },
                    "associations": {
                        "deals": {
                            "results": [
                                { "id": "deal_9902", "type": "contact_to_deal" }
                            ]
                        }
                    }
                }
            ]
        }
    },
    {
        slug: 'typeform-survey-responses-json',
        platform: 'Typeform',
        title: 'Mock Typeform Survey & Webhook Response JSON',
        description: 'Realistic Typeform responses JSON with nested answers, field references, choice objects, text responses, and calculated NPS scores.',
        converterSlug: 'typeform-json-to-excel',
        data: {
            "total_items": 2,
            "page_count": 1,
            "items": [
                {
                    "landing_id": "ab12cd34ef56",
                    "token": "tok_response_001",
                    "submitted_at": "2026-06-14T11:45:22Z",
                    "answers": [
                        { "field": { "id": "fld_name", "type": "short_text" }, "type": "text", "text": "Jessica Pearson" },
                        { "field": { "id": "fld_role", "type": "multiple_choice" }, "type": "choice", "choice": { "label": "Managing Partner" } },
                        { "field": { "id": "fld_nps", "type": "opinion_scale" }, "type": "number", "number": 10 }
                    ],
                    "hidden": { "utm_source": "linkedin", "campaign": "partner_onboarding" }
                },
                {
                    "landing_id": "ab12cd34ef57",
                    "token": "tok_response_002",
                    "submitted_at": "2026-06-14T12:05:10Z",
                    "answers": [
                        { "field": { "id": "fld_name", "type": "short_text" }, "type": "text", "text": "Harvey Specter" },
                        { "field": { "id": "fld_role", "type": "multiple_choice" }, "type": "choice", "choice": { "label": "Senior Partner" } },
                        { "field": { "id": "fld_nps", "type": "opinion_scale" }, "type": "number", "number": 9 }
                    ],
                    "hidden": { "utm_source": "direct", "campaign": "vip_survey" }
                }
            ]
        }
    },
    {
        slug: 'harvest-timesheets-json',
        platform: 'Harvest',
        title: 'Mock Harvest Timesheets & Time Entries JSON',
        description: 'Realistic Harvest API export with nested client, project, task, and user objects for consulting timesheet and payroll calculations.',
        converterSlug: 'harvest-json-to-excel',
        data: {
            "time_entries": [
                {
                    "id": 1490284,
                    "spent_date": "2026-07-01",
                    "hours": 7.5,
                    "notes": "Architecting Cloudflare D1 telemetry pipeline",
                    "billable": true,
                    "billable_rate": 175.00,
                    "cost_rate": 85.00,
                    "user": { "id": 8102, "name": "Elena Rostova" },
                    "client": { "id": 301, "name": "Stripe Technologies", "currency": "USD" },
                    "project": { "id": 9011, "name": "Telemetry Infrastructure", "code": "TEL-2026" },
                    "task": { "id": 401, "name": "Backend Development" }
                },
                {
                    "id": 1490285,
                    "spent_date": "2026-07-02",
                    "hours": 6.0,
                    "notes": "SEO programmatic metadata scaling and auditing",
                    "billable": true,
                    "billable_rate": 175.00,
                    "cost_rate": 85.00,
                    "user": { "id": 8102, "name": "Elena Rostova" },
                    "client": { "id": 302, "name": "HubSpot Integration Partner", "currency": "USD" },
                    "project": { "id": 9012, "name": "Growth Engine", "code": "GRO-2026" },
                    "task": { "id": 402, "name": "SEO Engineering" }
                }
            ]
        }
    },
    {
        slug: 'trello-board-cards-json',
        platform: 'Trello',
        title: 'Mock Trello Board JSON Export',
        description: 'Complete Trello board JSON structure containing cards, lists, labels, checklists, and member assignments for Kanban and project analysis.',
        converterSlug: 'trello-json-to-csv',
        data: {
            "id": "64f1a2b3c4d5e6f7a8b9c0d1",
            "name": "Product Sprint 2026",
            "desc": "Q3 Engineering & Design Sprint",
            "cards": [
                {
                    "id": "card_101",
                    "name": "Implement D1 SQLite Telemetry Worker",
                    "desc": "Zero-cost telemetry endpoint for conversion stats",
                    "listName": "In Progress",
                    "due": "2026-08-30T17:00:00.000Z",
                    "dueComplete": false,
                    "labels": [{ "name": "Backend", "color": "blue" }, { "name": "Priority", "color": "red" }],
                    "members": [{ "fullName": "Alex Developer", "username": "alexdev" }]
                },
                {
                    "id": "card_102",
                    "name": "Design Platform Visual Transform Assets",
                    "desc": "Authentic before/after SVG graphics for all converters",
                    "listName": "Ready for QA",
                    "due": "2026-08-29T12:00:00.000Z",
                    "dueComplete": true,
                    "labels": [{ "name": "Design", "color": "purple" }],
                    "members": [{ "fullName": "Jordan UI", "username": "jordan_ui" }]
                }
            ]
        }
    },
    {
        slug: 'slack-channel-history-json',
        platform: 'Slack',
        title: 'Mock Slack Channel Export JSON',
        description: 'Realistic Slack channel history export with nested user messages, reaction emojis, thread replies, and file attachments.',
        converterSlug: 'slack-json-to-csv',
        data: [
            {
                "type": "message",
                "user": "U01234567",
                "text": "Q3 product roadmap review is scheduled for 2 PM EST.",
                "ts": "1787931400.000200",
                "reply_count": 2,
                "reactions": [
                    { "name": "rocket", "count": 4, "users": ["U01234567", "U01234568"] },
                    { "name": "thumbsup", "count": 6, "users": ["U01234569"] }
                ]
            },
            {
                "type": "message",
                "user": "U01234568",
                "text": "The live telemetry worker has been successfully deployed to Cloudflare edge.",
                "ts": "1787931450.000300",
                "reply_count": 0,
                "reactions": [
                    { "name": "fire", "count": 5, "users": ["U01234567"] }
                ]
            }
        ]
    },
    {
        slug: 'jira-issues-sprints-json',
        platform: 'Jira',
        title: 'Mock Jira Software Issues & Sprints JSON',
        description: 'Jira REST API search response containing nested sprint boards, custom field values, story point estimates, and assignee metadata.',
        converterSlug: 'jira-json-to-excel',
        data: {
            "total": 2,
            "issues": [
                {
                    "key": "PROJ-101",
                    "fields": {
                        "summary": "Fix [object Object] nesting in CSV export",
                        "status": { "name": "Done", "category": "complete" },
                        "priority": { "name": "High" },
                        "issuetype": { "name": "Bug" },
                        "customfield_10014": "PROJ-EPIC-12",
                        "customfield_10020": [{ "id": 12, "name": "Sprint 48", "state": "active" }],
                        "assignee": { "displayName": "Dave Coder", "emailAddress": "dave@example.com" },
                        "storyPoints": 5
                    }
                },
                {
                    "key": "PROJ-102",
                    "fields": {
                        "summary": "Implement live Google Search Console API pull",
                        "status": { "name": "In Review", "category": "indeterminate" },
                        "priority": { "name": "Highest" },
                        "issuetype": { "name": "Task" },
                        "customfield_10014": "PROJ-EPIC-12",
                        "customfield_10020": [{ "id": 12, "name": "Sprint 48", "state": "active" }],
                        "assignee": { "displayName": "Sarah Arch", "emailAddress": "sarah@example.com" },
                        "storyPoints": 8
                    }
                }
            ]
        }
    },
    {
        slug: 'youtube-analytics-daily-json',
        platform: 'YouTube',
        title: 'Mock YouTube Analytics Daily Metrics JSON',
        description: 'YouTube Analytics API response with multi-column daily metrics for views, watch time, subscriber delta, and estimated revenue.',
        converterSlug: 'youtube-analytics-json-to-excel',
        data: {
            "kind": "youtubeAnalytics#resultTable",
            "columnHeaders": [
                { "name": "day", "columnType": "DIMENSION", "dataType": "STRING" },
                { "name": "views", "columnType": "METRIC", "dataType": "INTEGER" },
                { "name": "estimatedMinutesWatched", "columnType": "METRIC", "dataType": "INTEGER" },
                { "name": "subscribersGained", "columnType": "METRIC", "dataType": "INTEGER" },
                { "name": "estimatedRevenue", "columnType": "METRIC", "dataType": "FLOAT" }
            ],
            "rows": [
                ["2026-08-26", 14200, 71500, 310, 142.80],
                ["2026-08-27", 16850, 84200, 420, 185.50],
                ["2026-08-28", 19400, 96000, 490, 210.25]
            ]
        }
    },
    {
        slug: 'mongodb-collection-json-example',
        platform: 'MongoDB',
        title: 'Mock MongoDB Collection JSON with ObjectIds & ISODates',
        description: 'MongoDB compass/mongodump JSON export containing `$oid` ObjectIds, `$date` timestamps, and nested document arrays.',
        converterSlug: 'mongodb-bson-json-to-excel',
        data: [
            {
                "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
                "accountNumber": "ACC-99018",
                "tier": "enterprise",
                "createdAt": { "$date": "2026-01-15T08:30:00.000Z" },
                "settings": {
                    "mfaEnabled": true,
                    "ipWhitelist": ["192.168.1.100", "10.0.0.1"]
                },
                "usageMetrics": {
                    "apiCalls": 450000,
                    "storageGb": 84.5
                }
            },
            {
                "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c002" },
                "accountNumber": "ACC-99019",
                "tier": "growth",
                "createdAt": { "$date": "2026-02-20T14:15:00.000Z" },
                "settings": {
                    "mfaEnabled": false,
                    "ipWhitelist": []
                },
                "usageMetrics": {
                    "apiCalls": 120000,
                    "storageGb": 22.1
                }
            }
        ]
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
