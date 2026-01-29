
export interface ConverterPageConfig {
    slug: string; // e.g., 'stripe-json-to-excel'
    platformName: string; // e.g., 'Stripe'
    title: string; // Meta title
    description: string; // Meta description
    h1: string; // H1 Heading
    subheading: string;
    tldr?: string; // Zero-click answer for AI
    content: {
        intro: string;
        features: string[];
    };
    faqs: {
        question: string;
        answer: string;
    }[];
}

// Top 10 High-Value Platforms for "Drip Feed" Launch
export const converterPages: ConverterPageConfig[] = [
    {
        slug: 'salesforce-json-to-excel',
        platformName: 'Salesforce',
        title: 'Convert Salesforce JSON to Excel - 100% Secure & Private',
        description: 'Securely convert Salesforce Data Exports and API responses to Excel. 100% client-side processing (GDPR safe) for sensitive customer data. Handles nested attributes automatically.',
        h1: 'Salesforce JSON to Excel Converter',
        subheading: 'Export Accounts, Opportunities, and Reports to Excel without cloud uploads.',
        tldr: "To convert Salesforce data to Excel securely, paste your JSON export (from Workbench, Data Loader, or API) below. We automatically flatten the `records` array and nested `attributes` metadata into a clean table, processing everything locally in your browser to ensure no PII leaves your device.",
        content: {
            intro: 'Salesforce data exports often come in complex JSON formats, especially when using the REST API or tools like Workbench. Traditional online converters require you to upload this sensitive customer data to their servers—a massive security risk. JsonExport solves this by processing your Salesforce data 100% in your browser.',
            features: [
                'Smart Flattening for `attributes` and nested objects',
                '100% Client-Side Processing (GDPR/Compliance Safe)',
                'Handles large 50MB+ Data Exports',
                'Perfect for cleaning Data Loader exports'
            ]
        },
        faqs: [
            {
                question: "Is it safe to paste Salesforce customer lists here?",
                answer: "Yes, absolutely. Unlike other converters, we do NOT upload your file to any server. All processing happens locally in your browser's memory. You can even disconnect your internet after loading the page and it will still work."
            },
            {
                question: "How do I handle the 'attributes' field in Salesforce JSON?",
                answer: "Our Smart Flattener automatically detects the standard Salesforce `attributes` object (containing `type` and `url`) and handles it intelligently, so you can focus on the actual record data like Name, Email, and Revenue."
            },
            {
                question: "Can I convert nested sub-queries?",
                answer: "Yes. If your SOQL query included sub-queries (e.g., Contacts within Accounts), our tool will flatten these relationships so you can view them in a single spreadsheet view."
            }
        ]
    },
    {
        slug: 'stripe-json-to-excel',
        platformName: 'Stripe',
        title: 'Convert Stripe JSON to Excel (XLSX) - Free & Private',
        description: 'Instantly convert Stripe API responses (Charges, Invoices, Customers) to Excel. Flatten nested metadata and line items automatically.',
        h1: 'Stripe JSON to Excel Converter',
        subheading: 'Turn raw Stripe API logs into clean, readable financial reports.',
        tldr: "To convert Stripe JSON to Excel, simply copy the full JSON response from your Stripe Developer Dashboard logs and paste it into the converter below. The tool automatically flattens nested metadata and line items into separate columns.",
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
            },
            {
                question: "Is my Stripe financial data secure?",
                answer: "Yes. This tool runs 100% in your browser. Your financial data is never sent to any server, making it safe for sensitive PII and transaction details."
            },
            {
                question: "Can I convert Stripe Invoices to CSV?",
                answer: "Absolutely. Paste the JSON for an Invoice object (or a list of Invoices), and we'll generate a CSV or Excel file with all line items detailed."
            }
        ]
    },
    {
        slug: 'shopify-json-to-csv',
        platformName: 'Shopify',
        title: 'Convert Shopify JSON to CSV - Order & Product Export',
        description: 'Export Shopify Orders and Products JSON to CSV. Smart handling for Line Items, Variants, and Tax Lines.',
        h1: 'Shopify JSON to CSV Converter',
        subheading: 'Visualize Shopify Order structures and Line Items in flat CSV format.',
        tldr: "Convert Shopify JSON to CSV by pasting your Admin API response (e.g., orders.json) into the tool. It automatically creates rows for each Line Item while preserving order-level details.",
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
            },
            {
                question: "How do I handle multiple line items per order?",
                answer: "Our converter automatically 'unwinds' the line_items array, creating a row for each item while repeating the parent order information, perfect for pivot tables."
            },
            {
                question: "Do I need a Shopify App or API Token?",
                answer: "No. You don't need to install any app. Just copy the JSON data you already have and paste it here."
            }
        ]
    },
    {
        slug: 'jira-json-to-excel',
        platformName: 'Jira',
        title: 'Jira JSON to Excel Converter - Issues & Sprints',
        description: 'Convert Jira API exports to Excel. Analyze issues, comments, and sprint cycles in a clean spreadsheet.',
        h1: 'Jira JSON to Excel Converter',
        subheading: 'Analyze your team\'s velocity by converting Jira JSON dumps to Excel.',
        tldr: "To analyze Jira data in Excel, simply export your issues as JSON from the Jira Advanced Search or API, then paste the result here. We extract custom fields into their own columns for easy sorting.",
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
            },
            {
                question: "Can I visualize Sprint burndown charts?",
                answer: "Yes. Once converted to Excel, you can use the 'Created' and 'Resolution Date' columns to build custom burndown or velocity charts."
            }
        ]
    },
    {
        slug: 'trello-json-to-csv',
        platformName: 'Trello',
        title: 'Trello JSON to CSV - Card & Board Export',
        description: 'Export Trello Boards and Cards to CSV. Backup your specialized Trello workflows to a universal format.',
        h1: 'Trello JSON to CSV Converter',
        subheading: 'Backup and analyze your Trello Boards in standard CSV format.',
        tldr: "Quickly convert Trello JSON to CSV by appending '.json' to your board URL, copying the data, and pasting it here. We link Cards to Lists and Labels suitable for import into other tools.",
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
            },
            {
                question: "Can I see which list a card belongs to?",
                answer: "Yes. Trello stores lists separately, but our tool automatically looks up the 'idList' for each card and resolves it to a readable List Name in your CSV."
            }
        ]
    },
    {
        slug: 'youtube-analytics-json-to-excel',
        platformName: 'YouTube',
        title: 'YouTube Analytics JSON to Excel Converter',
        description: 'Convert YouTube Data API responses to Excel. Analyze video performance, comments, and playlists.',
        h1: 'YouTube Analytics JSON to Excel',
        subheading: 'Deep dive into your channel performance with custom Excel analysis.',
        tldr: "Export more than 500 rows of analytics data by taking the JSON response from YouTube Studio (or Data API) and converting it to Excel here. Analyze video tags, earnings, and watch time in bulk.",
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
            },
            {
                question: "How do I get my YouTube Comments into Excel?",
                answer: "Use the YouTube Data API to fetch 'commentThreads'. Paste that JSON here to get a spreadsheet of all comments, authors, and like counts."
            }
        ]
    },
    {
        slug: 'slack-json-to-csv',
        platformName: 'Slack',
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
        platformName: 'Discord',
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
        platformName: 'MongoDB',
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
        platformName: 'PostgreSQL',
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
        platformName: 'Notion',
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
    },
    {
        slug: 'salesforce-contacts-to-excel',
        platformName: 'Salesforce',
        title: 'Export Salesforce Contacts to Excel (Clean & Formatted)',
        description: 'Convert Salesforce Contact exports/JSON to Excel. Automatically resolves Account Names and Owner IDs.',
        h1: 'Salesforce Contacts to Excel',
        subheading: 'Clean your Salesforce contact lists without complex Data Loader operations.',
        tldr: "Exporting Contacts often results in messy data with IDs instead of names. Paste your Salesforce JSON export here to instantly get a clean Excel sheet with resolved Account Names and Owner details.",
        content: {
            intro: 'Salesforce contact exports are notorious for being messy. You get disparate IDs, nested address fields, and unusable metadata. This tool cleans it all instantly.',
            features: [
                'Resolves `Account.Name` automatically',
                'Formats Addresses into separate columns',
                'Handles multi-select Interest tags',
                '100% Private - Your contact list never leaves your browser'
            ]
        },
        faqs: [
            {
                question: "Is it safe for GDPR/CCPA?",
                answer: "Yes. We process data 100% client-side. No contact data is ever uploaded to our servers, ensuring full compliance."
            }
        ]
    },
    {
        slug: 'salesforce-opportunities-to-excel',
        platformName: 'Salesforce',
        title: 'Export Salesforce Opportunities to Excel Pipeline Report',
        description: 'Convert Salesforce Opportunity JSON to Excel. Analyze your pipeline, probability, and stages in a clean spreadsheet.',
        h1: 'Salesforce Opportunities to Excel',
        subheading: 'Visualize your sales pipeline by converting raw Opportunity data to Excel.',
        tldr: "Turn raw Salesforce Opportunity JSON into a ready-to-use Pipeline Report. We flatten the data so you can pivot by Stage, Owner, and Close Date immediately.",
        content: {
            intro: 'Pipeline analysis requires clean data. Native Salesforce exports often hide valuable signals in nested objects (like Probability or Stage history). We bring them to the surface.',
            features: [
                'Expands `Stage` and `Probability` data',
                'Resolves `Account` relationships',
                'Formats Currency fields correctly',
                'Great for QBR preparation'
            ]
        },
        faqs: [
            {
                question: "Does this export custom fields?",
                answer: "Yes. All custom fields (ending in `__c`) are automatically detected and included as their own columns."
            }
        ]
    },
    {
        slug: 'salesforce-reports-to-excel',
        platformName: 'Salesforce',
        title: 'Convert Salesforce Reports JSON to Excel',
        description: 'Fix broken Salesforce Report exports. Flatten nested JSON and analytics data into standard Excel tables.',
        h1: 'Salesforce Reports to Excel',
        subheading: 'Recover usable data from complex Salesforce Report API responses.',
        tldr: "If you're using the Salesforce Analytics API, you get complex JSON responses. This tool flattens that hierarchical report data into a simple flat table.",
        content: {
            intro: 'The Salesforce Analytics API is powerful but returns deeply nested "fact maps" that are impossible to read. We decode them into standard rows and columns.',
            features: [
                'Decodes "fact maps" and aggregates',
                'Preserves grouping levels',
                'Converts summary formulas to values',
                'No coding required'
            ]
        },
        faqs: [
            {
                question: "Can I export Matrix reports?",
                answer: "Yes, we flatten the matrix structure into a tabular list so you can re-pivot it in Excel exactly how you want."
            }
        ]
    },
    {
        slug: 'asana-json-to-excel',
        platformName: 'Asana',
        title: 'Asana JSON to Excel Converter - Tasks & Projects',
        description: 'Convert Asana project exports to Excel. Analyze task dependencies, due dates, and assignees.',
        h1: 'Asana JSON to Excel Converter',
        subheading: 'Turn Asana project data into flexible Excel reports.',
        tldr: "Export your Asana project as JSON and paste it here. We'll convert your tasks, subtasks, and custom fields into a structured Excel timeline.",
        content: {
            intro: 'Asana is great for management, but Excel is king for reporting. Bridge the gap by converting your Asana JSON exports into clean spreadsheets.',
            features: [
                'Handles Subtasks automatically',
                'Extracts Assignee names from user objects',
                'Formats "Due On" dates for Excel',
                'Preserves custom field values'
            ]
        },
        faqs: [
            {
                question: "Does this handle subtasks?",
                answer: "Yes. Subtasks are included with a reference to their parent task, allowing you to filter or group them easily in Excel."
            }
        ]
    }
];
