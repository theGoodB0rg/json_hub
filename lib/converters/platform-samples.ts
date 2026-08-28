/**
 * Authentic, high-fidelity platform JSON sample payloads.
 * Used for live demo previews, test datasets, and format verification.
 */

export interface PlatformSample {
    platform: string;
    description: string;
    sampleJson: string;
    expectedColumns: string[];
}

export const PLATFORM_SAMPLES: Record<string, PlatformSample> = {
    trello: {
        platform: 'Trello',
        description: 'Trello Board Export with cards, lists, checklists, and members',
        sampleJson: JSON.stringify({
            id: "64f1a2b3c4d5e6f7a8b9c0d1",
            name: "Product Sprint 2026",
            desc: "Q3 Engineering & Design Sprint",
            closed: false,
            lists: [
                { id: "list_01", name: "In Progress", closed: false, pos: 1 },
                { id: "list_02", name: "Ready for QA", closed: false, pos: 2 },
                { id: "list_03", name: "Done", closed: false, pos: 3 }
            ],
            cards: [
                {
                    id: "card_101",
                    name: "Implement D1 SQLite Telemetry Worker",
                    desc: "Zero-cost telemetry endpoint for conversion stats",
                    idList: "list_01",
                    listName: "In Progress",
                    due: "2026-08-30T17:00:00.000Z",
                    dueComplete: false,
                    labels: [{ id: "lbl_1", name: "Backend", color: "blue" }, { id: "lbl_2", name: "Priority", color: "red" }],
                    checklists: [
                        {
                            id: "chk_1",
                            name: "Tasks",
                            checkItems: [
                                { id: "item_1", name: "Create schema.sql", state: "complete" },
                                { id: "item_2", name: "Wrangler binding", state: "complete" },
                                { id: "item_3", name: "CLI pull script", state: "incomplete" }
                            ]
                        }
                    ],
                    members: [{ id: "mem_1", fullName: "Alex Developer", username: "alexdev" }]
                },
                {
                    id: "card_102",
                    name: "Design Platform Visual Transform Assets",
                    desc: "Authentic before/after SVG graphics for all converters",
                    idList: "list_02",
                    listName: "Ready for QA",
                    due: "2026-08-29T12:00:00.000Z",
                    dueComplete: true,
                    labels: [{ id: "lbl_3", name: "Design", color: "purple" }],
                    checklists: [],
                    members: [{ id: "mem_2", fullName: "Jordan UI", username: "jordan_ui" }]
                }
            ]
        }, null, 2),
        expectedColumns: ['id', 'name', 'desc', 'listName', 'due', 'dueComplete', 'labels.0.name', 'labels.1.name']
    },

    postman: {
        platform: 'Postman',
        description: 'Postman Collection v2.1 with requests, headers, methods, and endpoints',
        sampleJson: JSON.stringify({
            info: {
                _postman_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                name: "Stripe & Coupler API Suite",
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            item: [
                {
                    name: "Get Invoices",
                    request: {
                        method: "GET",
                        header: [
                            { key: "Authorization", value: "Bearer {{STRIPE_API_KEY}}", type: "text" },
                            { key: "Content-Type", value: "application/json", type: "text" }
                        ],
                        url: {
                            raw: "https://api.stripe.com/v1/invoices?limit=100",
                            protocol: "https",
                            host: ["api", "stripe", "com"],
                            path: ["v1", "invoices"],
                            query: [{ key: "limit", value: "100" }]
                        },
                        description: "Fetch list of recent customer invoices"
                    },
                    response: [
                        {
                            name: "200 Success",
                            status: "OK",
                            code: 200,
                            body: "{\"object\": \"list\", \"data\": []}"
                        }
                    ]
                },
                {
                    name: "Create Customer Record",
                    request: {
                        method: "POST",
                        header: [
                            { key: "Authorization", value: "Bearer {{STRIPE_API_KEY}}", type: "text" }
                        ],
                        url: {
                            raw: "https://api.stripe.com/v1/customers",
                            protocol: "https",
                            host: ["api", "stripe", "com"],
                            path: ["v1", "customers"]
                        },
                        body: {
                            mode: "raw",
                            raw: "{\"email\": \"customer@example.com\", \"name\": \"Acme Corp\"}"
                        }
                    }
                }
            ]
        }, null, 2),
        expectedColumns: ['name', 'request.method', 'request.url.raw', 'request.header.0.key', 'request.description']
    },

    figma: {
        platform: 'Figma',
        description: 'Figma Variables and Design Tokens export',
        sampleJson: JSON.stringify({
            version: "1.0.0",
            metadata: {
                fileKey: "fig_xyz789",
                fileName: "Design System 2026",
                exportedAt: "2026-08-28T10:00:00Z"
            },
            collections: [
                {
                    id: "VariableCollectionId:101:1",
                    name: "Colors & Tokens",
                    modes: [
                        { modeId: "101:0", name: "Light Mode" },
                        { modeId: "101:1", name: "Dark Mode" }
                    ],
                    variables: [
                        {
                            id: "VariableID:201:1",
                            name: "colors/primary/default",
                            resolvedType: "COLOR",
                            valuesByMode: {
                                "101:0": { r: 0.12, g: 0.44, b: 0.98, a: 1.0 },
                                "101:1": { r: 0.24, g: 0.58, b: 1.00, a: 1.0 }
                            },
                            description: "Primary Brand Color for buttons and links"
                        },
                        {
                            id: "VariableID:202:1",
                            name: "spacing/layout/padding-lg",
                            resolvedType: "FLOAT",
                            valuesByMode: {
                                "101:0": 32,
                                "101:1": 32
                            },
                            description: "Standard container outer margin"
                        }
                    ]
                }
            ]
        }, null, 2),
        expectedColumns: ['collections.0.variables.0.name', 'collections.0.variables.0.resolvedType']
    },

    jira: {
        platform: 'Jira',
        description: 'Jira Cloud / Server Issue Search Export',
        sampleJson: JSON.stringify({
            expand: "schema,names",
            startAt: 0,
            maxResults: 50,
            total: 2,
            issues: [
                {
                    id: "10024",
                    key: "ENG-1420",
                    fields: {
                        summary: "Database connection pool timeout in EU cluster",
                        status: { name: "In Progress", statusCategory: { name: "In Progress", colorName: "yellow" } },
                        priority: { name: "High", id: "2" },
                        issuetype: { name: "Bug" },
                        assignee: { displayName: "Sarah Chen", emailAddress: "sarah@company.com" },
                        reporter: { displayName: "DevOps Bot" },
                        created: "2026-08-25T08:14:22.000+0000",
                        updated: "2026-08-28T09:30:00.000+0000",
                        customfield_10015: "Sprint 42",
                        customfield_10020: 5.0
                    }
                },
                {
                    id: "10025",
                    key: "ENG-1421",
                    fields: {
                        summary: "Upgrade Tauri binary auto-updater certificate",
                        status: { name: "Done", statusCategory: { name: "Done", colorName: "green" } },
                        priority: { name: "Medium", id: "3" },
                        issuetype: { name: "Task" },
                        assignee: { displayName: "Alex Developer", emailAddress: "alex@company.com" },
                        reporter: { displayName: "Sarah Chen" },
                        created: "2026-08-26T11:00:00.000+0000",
                        updated: "2026-08-28T10:15:00.000+0000",
                        customfield_10015: "Sprint 42",
                        customfield_10020: 3.0
                    }
                }
            ]
        }, null, 2),
        expectedColumns: ['id', 'key', 'fields.summary', 'fields.status.name', 'fields.priority.name', 'fields.assignee.displayName']
    },

    discord: {
        platform: 'Discord',
        description: 'Discord Channel Chat Exporter JSON',
        sampleJson: JSON.stringify({
            guild: { id: "987654321", name: "Developer Community Hub", iconUrl: "https://cdn.discordapp.com/icons/..." },
            channel: { id: "123456789", type: "GuildTextChat", name: "general-chat", topic: "Discussions & Q&A" },
            messages: [
                {
                    id: "msg_001",
                    type: "Default",
                    timestamp: "2026-08-28T10:15:30.000Z",
                    author: { id: "usr_99", name: "TechLead", nickname: "Alex", isBot: false },
                    content: "Has anyone benchmarked the JSON flattener on 100MB files?",
                    attachments: [],
                    reactions: [{ emoji: { name: "🚀" }, count: 5 }]
                },
                {
                    id: "msg_002",
                    type: "Default",
                    timestamp: "2026-08-28T10:16:45.000Z",
                    author: { id: "usr_102", name: "RustEnthusiast", nickname: "Dev", isBot: false },
                    content: "Yes! The streaming worker handled 500k rows in ~3.2 seconds.",
                    attachments: [{ id: "att_1", url: "https://cdn.discordapp.com/attachments/benchmark.png", fileName: "benchmark.png" }],
                    reactions: [{ emoji: { name: "🔥" }, count: 8 }]
                }
            ]
        }, null, 2),
        expectedColumns: ['id', 'timestamp', 'author.name', 'author.nickname', 'content', 'reactions.0.emoji.name', 'reactions.0.count']
    },

    slack: {
        platform: 'Slack',
        description: 'Slack Workspace Channel Export',
        sampleJson: JSON.stringify([
            {
                client_msg_id: "c-101",
                type: "message",
                text: "Export completed for monthly analytics reconciliation.",
                user: "U0123ABCD",
                userName: "Finance Lead",
                ts: "1724836800.000200",
                thread_ts: "1724836800.000200",
                reply_count: 2,
                reactions: [{ name: "white_check_mark", count: 3, users: ["U0123ABCD", "U0999EFGH"] }]
            },
            {
                client_msg_id: "c-102",
                type: "message",
                text: "All numbers match the Stripe invoice ledger perfectly.",
                user: "U0999EFGH",
                userName: "Senior Accountant",
                ts: "1724836920.000400",
                thread_ts: "1724836800.000200"
            }
        ], null, 2),
        expectedColumns: ['client_msg_id', 'type', 'text', 'userName', 'ts', 'reactions.0.name']
    },

    stripe: {
        platform: 'Stripe',
        description: 'Stripe Charges and Invoices API Export',
        sampleJson: JSON.stringify({
            object: "list",
            data: [
                {
                    id: "ch_3Mvw00LkdIwHu7ix0AaBbCc1",
                    object: "charge",
                    amount: 4900,
                    amount_captured: 4900,
                    currency: "usd",
                    status: "succeeded",
                    customer: "cus_N1a2b3c4",
                    description: "Pro Plan Subscription (Annual)",
                    paid: true,
                    receipt_email: "billing@acme.org",
                    metadata: {
                        company_id: "corp_9021",
                        plan_tier: "enterprise_pro",
                        seats: "15"
                    },
                    payment_method_details: {
                        type: "card",
                        card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2028, country: "US" }
                    }
                },
                {
                    id: "ch_3Mvw00LkdIwHu7ix0AaBbCc2",
                    object: "charge",
                    amount: 2900,
                    amount_captured: 2900,
                    currency: "usd",
                    status: "succeeded",
                    customer: "cus_N5d6e7f8",
                    description: "Standard Plan License",
                    paid: true,
                    receipt_email: "support@startup.io",
                    metadata: {
                        company_id: "corp_4412",
                        plan_tier: "standard"
                    },
                    payment_method_details: {
                        type: "card",
                        card: { brand: "mastercard", last4: "8888", exp_month: 6, exp_year: 2027, country: "GB" }
                    }
                }
            ],
            has_more: false
        }, null, 2),
        expectedColumns: ['id', 'amount', 'currency', 'status', 'customer', 'metadata.company_id', 'metadata.plan_tier', 'payment_method_details.card.brand']
    },

    shopify: {
        platform: 'Shopify',
        description: 'Shopify Admin API Orders Export with Line Items',
        sampleJson: JSON.stringify({
            orders: [
                {
                    id: 5678901234,
                    order_number: 1042,
                    email: "customer@domain.com",
                    created_at: "2026-08-28T09:12:00-04:00",
                    financial_status: "paid",
                    fulfillment_status: "fulfilled",
                    total_price: "189.50",
                    currency: "USD",
                    customer: {
                        first_name: "Emma",
                        last_name: "Watson",
                        orders_count: 3
                    },
                    line_items: [
                        {
                            id: 99887766,
                            title: "Wireless Mechanical Keyboard",
                            quantity: 1,
                            price: "149.50",
                            sku: "KB-MECH-W",
                            vendor: "KeyTech"
                        },
                        {
                            id: 99887767,
                            title: "Custom PBT Keycaps Set",
                            quantity: 1,
                            price: "40.00",
                            sku: "KC-PBT-01",
                            vendor: "KeyTech"
                        }
                    ]
                }
            ]
        }, null, 2),
        expectedColumns: ['id', 'order_number', 'financial_status', 'total_price', 'customer.first_name', 'line_items.0.title', 'line_items.0.price']
    },

    mongodb: {
        platform: 'MongoDB',
        description: 'MongoDB Extended JSON Document Export',
        sampleJson: JSON.stringify([
            {
                _id: { $oid: "64f1a2b3c4d5e6f7a8b9c001" },
                sku: "SRV-COMPUTE-L",
                name: "Dedicated Cloud Instance",
                specs: {
                    vCpu: 16,
                    ramGb: 64,
                    storage: { type: "NVMe", sizeGb: 1000 }
                },
                tags: ["cloud", "eu-central", "production"],
                createdAt: { $date: "2026-01-15T00:00:00.000Z" },
                isActive: true
            },
            {
                _id: { $oid: "64f1a2b3c4d5e6f7a8b9c002" },
                sku: "SRV-COMPUTE-M",
                name: "Standard Web Worker",
                specs: {
                    vCpu: 8,
                    ramGb: 32,
                    storage: { type: "NVMe", sizeGb: 500 }
                },
                tags: ["cloud", "us-east", "staging"],
                createdAt: { $date: "2026-02-10T00:00:00.000Z" },
                isActive: true
            }
        ], null, 2),
        expectedColumns: ['_id.$oid', 'sku', 'name', 'specs.vCpu', 'specs.ramGb', 'specs.storage.sizeGb', 'createdAt.$date', 'isActive']
    }
};

export function getPlatformSample(platformKey: string): PlatformSample {
    const key = platformKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, sample] of Object.entries(PLATFORM_SAMPLES)) {
        if (key.includes(k)) {
            return sample;
        }
    }
    return PLATFORM_SAMPLES.trello;
}
