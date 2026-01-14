
export interface ConverterPageConfig {
    slug: string; // e.g., 'stripe-json-to-excel'
    title: string; // Meta title
    description: string; // Meta description
    h1: string; // H1 Heading
    subheading: string;
    content: {
        intro: string;
        features: string[];
    };
    faqs: {
        question: string;
        answer: string;
    }[];
}

export const converterPages: ConverterPageConfig[] = [
    {
        slug: 'stripe-json-to-excel',
        title: 'Convert Stripe JSON to Excel (XLSX) - Free & Private',
        description: 'Instantly convert Stripe API responses (Charges, Invoices, Customers) to Excel. Flatten nested metadata and line items automatically.',
        h1: 'Stripe JSON to Excel Converter',
        subheading: 'Turn raw Stripe API logs into clean, readable financial reports.',
        content: {
            intro: 'Stripe API data is powerful but difficult to read in its raw JSON format. Nested objects like `metadata`, `shipping`, and `payment_method_details` make it hard to analyze in spreadsheets.',
            features: [
                'Expands nested `metadata` fields into columns',
                'Handles Stripe timestamp conversion automatically',
                'Perfect for reconciling Invoices and Charges',
                '100% Client-side privacy - no data sent to our servers'
            ]
        },
        faqs: [
            {
                question: "How do I export Stripe data to Excel?",
                answer: "You can use the Stripe Dashboard for basic exports, but for full API response analysis, copy the JSON from your Stripe Developer logs and paste it into our secure converter."
            },
            {
                question: "Does this handle nested Stripe metadata?",
                answer: "Yes! Our 'Smart Flattener' algorithm detects nested objects like metadata and creates separate columns (e.g., metadata.order_id, metadata.customer_ref) automatically."
            }
        ]
    },
    {
        slug: 'shopify-json-to-csv',
        title: 'Convert Shopify JSON to CSV - Order & Product Export',
        description: 'Export Shopify Orders and Products JSON to CSV. Smart handling for Line Items, Variants, and Tax Lines.',
        h1: 'Shopify JSON to CSV Converter',
        subheading: 'Visualize Shopify Order structures and Line Items in flat CSV format.',
        content: {
            intro: 'Shopify JSON objects are deeply nested. Orders contain Line Items, which contain Tax Lines and Discount Allocations. Standard converters break this structure.',
            features: [
                'Preserves Line Item relationships in Nested View',
                'Flattens Variants for easy product catalog management',
                'Compatible with Excel and Google Sheets',
                'Private and secure conversion for sensitive customer data'
            ]
        },
        faqs: [
            {
                question: "Can I convert Shopify Orders JSON to CSV?",
                answer: "Yes. Simply paste your Shopify Admin API response (e.g., from the /orders.json endpoint) into the editor to get a clean CSV export."
            }
        ]
    },
    {
        slug: 'jira-json-to-excel',
        title: 'Jira JSON to Excel Converter - Issues & Sprints',
        description: 'Convert Jira API exports to Excel. Analyze issues, comments, and sprint cycles in a clean spreadsheet.',
        h1: 'Jira JSON to Excel Converter',
        subheading: 'Analyze your team\'s velocity by converting Jira JSON dumps to Excel.',
        content: {
            intro: 'Jira exports allow for deep analysis of ticket velocity and sprint health, but the JSON format is complex. Convert it to Excel to build your own custom dashboards.',
            features: [
                'Extracts Issue "fields" into top-level columns',
                'Handles custom fields automatically',
                'Great for sprint retrospective analysis',
                'No API token required - just paste the JSON'
            ]
        },
        faqs: [
            {
                question: "How to specific custom fields from Jira JSON?",
                answer: "Our converter flattens the 'fields' object, so 'fields.customfield_1001' becomes a column you can easily rename and analyze in Excel."
            }
        ]
    },
    {
        slug: 'trello-json-to-csv',
        title: 'Trello JSON to CSV - Card & Board Export',
        description: 'Export Trello Boards and Cards to CSV. Backup your specialized Trello workflows to a universal format.',
        h1: 'Trello JSON to CSV Converter',
        subheading: 'Backup and analyze your Trello Boards in standard CSV format.',
        content: {
            intro: 'Trello offers a JSON export for every board. This tool lets you turn that backup into a readable CSV database of all your cards, lists, and members.',
            features: [
                'Connects Cards to their Lists',
                'Extracts labels into readable text',
                'Backup your project history locally',
                'Analyze card aging and activity'
            ]
        },
        faqs: [
            {
                question: "How do I get JSON from Trello?",
                answer: "Add '.json' to the end of any Trello Board URL (e.g., trello.com/b/boardID.json) to instantly get the raw data, then paste it here."
            }
        ]
    },
    {
        slug: 'youtube-analytics-json-to-excel',
        title: 'YouTube Analytics JSON to Excel Converter',
        description: 'Convert YouTube Data API responses to Excel. Analyze video performance, comments, and playlists.',
        h1: 'YouTube Analytics JSON to Excel',
        subheading: 'Deep dive into your channel performance with custom Excel analysis.',
        content: {
            intro: 'The YouTube Data API provides rich insights that aren\'t always available in YouTube Studio. Export raw data to Excel to build custom growth models.',
            features: [
                'Analyze video tags and engagement metrics',
                'Bulk export comment threads',
                'Flatten playlist item structures',
                'Free and 100% private'
            ]
        },
        faqs: [
            {
                question: "Is this safe for channel data?",
                answer: "Yes. Since we process everything in the browser, your channel data never touches our servers. It's the safest way to convert private analytics data."
            }
        ]
    },
    {
        slug: 'slack-json-to-csv',
        title: 'Convert Slack Export JSON to CSV - Channels & Messages',
        description: 'Convert Slack workspace exports to CSV. Analyze message history, user activity, and channel logs in Excel.',
        h1: 'Slack JSON to CSV Converter',
        subheading: 'Turn your Slack data export into a readable message archive.',
        content: {
            intro: 'Slack exports are a goldmine of organizational knowledge, but the JSON format is fragmented across thousands of files. Our tool stitches them together into a single, analysis-ready CSV.',
            features: [
                'Merges daily JSON files into one master sheet',
                'Extracts user real names from IDs',
                'Formats timestamps into readable dates',
                'Perfect for HR and auditing'
            ]
        },
        faqs: [
            {
                question: "How do I analyze Slack history?",
                answer: "Upload your Slack export JSONs. We flatten the message structure, making it easy to filter by user, date, or channel in Excel."
            }
        ]
    },
    {
        slug: 'discord-json-to-excel',
        title: 'Discord Chat JSON to Excel Converter',
        description: 'Export Discord chat history to Excel. Analyze community engagement, user activity, and message trends.',
        h1: 'Discord JSON to Excel Converter',
        subheading: 'Analyze your community growth and engagement by converting Discord JSONs.',
        content: {
            intro: 'Community managers need data. Convert your Discord chat logs (from bot exports or GDPR requests) into Excel to visualize peak activity times and top contributors.',
            features: [
                'Flattens nested role and user objects',
                'Converts ISO timestamps to Excel dates',
                'Identify top active users',
                'Analyze sentiment by exporting message content'
            ]
        },
        faqs: [
            {
                question: "Can I convert Discord bot exports?",
                answer: "Yes. If you use a bot to dump channel history to JSON, our tool can flatten that structure into a readable spreadsheet instantly."
            }
        ]
    },
    {
        slug: 'mongodb-bson-json-to-excel',
        title: 'MongoDB Export JSON to Excel Converter',
        description: 'Convert MongoDB exports (JSON/BSON) to Excel. Flattens deep objects and arrays for easier analysis.',
        h1: 'MongoDB JSON to Excel Converter',
        subheading: 'Visualize your NoSQL database in a standard Excel spreadsheet.',
        content: {
            intro: 'MongoDB gives you flexibility, but business teams need Excel. Bridge the gap by converting your Mongo exports into flat, pivot-ready spreadsheets.',
            features: [
                'Handles MongoDB Extended JSON ($oid, $date)',
                'Flattens deeply nested documents',
                'Great for ad-hoc business reporting',
                'No database connection required'
            ]
        },
        faqs: [
            {
                question: "Does this handle ObjectID fields?",
                answer: "Yes. We automatically convert MongoDB specific fields like $oid and $date into clean strings and Excel-compatible dates."
            }
        ]
    },
    {
        slug: 'postgresql-json-to-csv',
        title: 'PostgreSQL JSON Column to CSV Converter',
        description: 'Export PostgreSQL JSON/JSONB columns to CSV. Flatten jsonb fields into separate columns for analysis.',
        h1: 'Postgres JSON to CSV Converter',
        subheading: 'Flatten your Postgres JSONB columns without writing complex SQL queries.',
        content: {
            intro: 'Storing data in JSONB columns is efficient, but querying it for reports is painful. Export your query results to JSON, and let us flatten the structure for you.',
            features: [
                'Flattens complex JSONB structures',
                'Preserves data types during conversion',
                'Analyze unstructured data in Excel',
                'Faster than writing recursive common table expressions'
            ]
        },
        faqs: [
            {
                question: "How do I export from Postgres to use this?",
                answer: "Run your query and export the result as JSON (or copy the JSONB cell content). Paste it here to instantly flatten it into columns."
            }
        ]
    },
    {
        slug: 'notion-json-to-excel',
        title: 'Notion Database JSON to Excel Converter',
        description: 'Convert Notion API exports to Excel. Backup your Notion databases and visualize properties in spreadsheets.',
        h1: 'Notion JSON to Excel Converter',
        subheading: 'Take your Notion databases offline. Convert API exports to real Excel tables.',
        content: {
            intro: 'Notion is great, but sometimes you need the power of Excel. Convert your Notion database exports into standard spreadsheets for deep analysis and charting.',
            features: [
                'Extracts "properties" into clean columns',
                'Handles Relation and Rollup data',
                'Converts status and select tags to text',
                'Backup your workspace data'
            ]
        },
        faqs: [
            {
                question: "Can I export my whole Notion workspace?",
                answer: "If you export your workspace as JSON/Markdown, you can take the JSON files and convert them one by one to Excel using this tool."
            }
        ]
    }
];
