
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
        slug: 'hubspot-json-to-excel',
        platformName: 'HubSpot',
        title: 'HubSpot to Excel — Export HubSpot JSON to Spreadsheet',
        description: 'Export HubSpot CRM data to Excel instantly. Flatten nested contact properties, deal stages, and company fields. 100% private — no upload required.',
        h1: 'HubSpot to Excel Converter',
        subheading: 'HubSpot nested JSON unreadable in Excel? Fix it instantly without cloud uploads.',
        tldr: "To fix nested HubSpot data in Excel, paste your JSON export below. We automatically flatten the deeply nested objects into a clean table, processing everything locally in your browser so your CRM data stays private.",
        content: {
            intro: 'HubSpot data exports often contain complex, deeply nested JSON properties. Traditional online converters just output `[object Object]` for these fields. JsonExport solves this by thoroughly flattening your HubSpot data 100% in your browser.',
            features: [
                'Fixes `[object Object]` columns instantly',
                'Smart Flattening for complex nested properties',
                '100% Client-Side Processing (GDPR/Compliance Safe)',
                'Perfect for analyzing HubSpot API dumps'
            ]
        },
        faqs: [
            {
                question: "Is it safe to paste HubSpot customer lists here?",
                answer: "Yes, absolutely. Unlike other converters, we do NOT upload your file to any server. All processing happens locally in your browser's memory."
            },
            {
                question: "How does it handle nested properties?",
                answer: "Our Smart Flattener automatically detects and flattens nested objects so that data like `properties.company_name` becomes a dedicated Excel column rather than a broken cell."
            }
        ]
    },
    {
        slug: 'salesforce-json-to-excel',
        platformName: 'Salesforce',
        title: 'Salesforce to Excel — Export Contacts, Opportunities & Reports',
        description: 'Convert Salesforce JSON exports to clean Excel spreadsheets. Fix [object Object] columns from Data Loader, Workbench, or REST API. 100% client-side.',
        h1: 'Salesforce to Excel Converter',
        subheading: 'Salesforce export showing `[object Object]` columns? Fix it instantly without cloud uploads.',
        tldr: "To fix broken Salesforce data in Excel, paste your JSON export (from Workbench, Data Loader, or API) below. We automatically flatten the `records` array and nested `attributes` metadata into a clean table, processing everything locally in your browser to ensure no PII leaves your device.",
        content: {
            intro: 'Salesforce data exports often come in complex JSON formats, especially when using the REST API or tools like Workbench. The result is often an Excel file full of useless `[object Object]` columns. JsonExport solves this by processing and flattening your Salesforce data 100% in your browser.',
            features: [
                'Fixes `[object Object]` columns instantly',
                'Smart Flattening for `attributes` and nested objects',
                '100% Client-Side Processing (GDPR/Compliance Safe)',
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
        title: 'Stripe to Excel — Export & Convert Stripe JSON Free',
        description: 'Export Stripe charges, invoices, and customers to Excel. Flatten nested metadata and line items automatically. Free, private, no upload.',
        h1: 'Stripe to Excel Converter',
        subheading: 'Stripe metadata columns unreadable in Excel? Flatten them instantly.',
        tldr: "To fix Stripe JSON in Excel, simply copy the full JSON response from your Stripe Developer Dashboard logs and paste it into the converter below. The tool automatically flattens nested metadata and line items into separate, usable columns.",
        content: {
            intro: 'Stripe API data is powerful but difficult to read in its raw JSON format. Nested objects like `metadata`, `shipping`, and `payment_method_details` often become `[object Object]` in spreadsheets, making them impossible to analyze.',
            features: [
                'Fixes unreadable `metadata` fields into clear columns',
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
        slug: 'nested-arrays-to-excel',
        platformName: 'Generic JSON',
        title: 'Flatten Nested Arrays JSON to Excel - Free & Private',
        description: 'Fix `[object Object]` and nested array exports. Convert deeply nested JSON into clean Excel rows instantly.',
        h1: 'Nested Arrays JSON to Excel Repair Tool',
        subheading: 'Nested arrays breaking your export? Flatten them into clean Excel rows instantly.',
        tldr: "Paste complex JSON with nested arrays and objects into the converter. We flatten it into analysis-ready rows and columns locally in your browser, so no data is uploaded.",
        content: {
            intro: 'Many JSON exports break in spreadsheets because arrays and nested objects cannot be represented in a single cell. This tool flattens deep structures into usable Excel rows while preserving important parent fields.',
            features: [
                'Fixes `[object Object]` and nested array columns',
                'Automatically unwinds array-of-object structures into rows',
                'Keeps parent-child context for reporting',
                '100% client-side processing for privacy'
            ]
        },
        faqs: [
            {
                question: "Can this handle mixed nested arrays and objects?",
                answer: "Yes. The parser flattens nested object paths and intelligently expands array structures so they become usable in Excel."
            },
            {
                question: "Will my data be uploaded?",
                answer: "No. Conversion happens in your browser, and your JSON never leaves your device."
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
        title: 'Trello JSON to CSV/Excel Converter - Import & Backup Tool',
        description: 'Convert Trello JSON exports to CSV/Excel for importing into other tools. Backup Boards, archive Cards, and migrate data securely locally.',
        h1: 'Trello JSON to CSV/Excel Converter',
        subheading: 'Prepare your Trello data for import into other systems or archive it for safekeeping.',
        tldr: "Need to import Trello data into another tool or Excel? Simply add '.json' to your Board URL, copy the code, and paste it here. We generate a clean CSV perfect for importing into Jira, Monday.com, or Excel.",
        content: {
            intro: 'Trello offers a JSON export for every board, but most tools cannot import it directly. This converter transforms your Trello JSON into a compatible CSV format ready for migration or analysis.',
            features: [
                'Format ready for Import (Jira/Monday/Asana)',
                'Connects Cards to Lists automatically',
                'Extracts Labels and Members',
                '100% Private local processing'
            ]
        },
        faqs: [
            {
                question: "How do I import Trello JSON into Excel?",
                answer: "You cannot import Trello JSON directly into Excel without conversion. Use this tool to first convert the JSON to CSV, which Excel can open immediately."
            },
            {
                question: "How do I get the JSON for my Board?",
                answer: "Go to your Trello Board, add `.json` to the end of the URL in your browser address bar, and press Enter. Copy the text that appears."
            },
            {
                question: "Can I use this for migration/backup?",
                answer: "Yes. This tool is designed to create a clean, flat database of your cards, making it ideal for migrating to a new project management tool or creating a hard-copy backup."
            }
        ]
    },
    {
        slug: 'youtube-analytics-json-to-excel',
        platformName: 'YouTube',
        title: 'YouTube Analytics to Excel — Export Channel Data Free',
        description: 'Convert YouTube Data API responses to Excel. Analyze video performance, comments, watch time, and playlists in spreadsheets. Free and private.',
        h1: 'YouTube Analytics to Excel Converter',
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
        title: 'Slack to CSV — Export Slack Messages & Chat History',
        description: 'Convert Slack workspace exports to CSV or Excel. Archive message history, user activity, and channel logs. 100% private local processing.',
        h1: 'Slack to CSV/Excel Converter',
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
        title: 'Fix Nested MongoDB JSON/BSON Exports to Excel',
        description: 'Convert nested MongoDB exports (JSON/BSON) to Excel. Flattens deep objects and arrays for easier analysis.',
        h1: 'MongoDB Nested Document Repair Tool',
        subheading: 'MongoDB nested documents showing as `[object Object]`? Flatten them instantly.',
        content: {
            intro: 'MongoDB gives you flexibility, but business teams need Excel. When converting Mongo exports, nested documents often break standard converters. We bridge the gap by correctly transforming your nested Mongo exports into flat, pivot-ready spreadsheets.',
            features: [
                'Fixes nested objects showing as `[object Object]`',
                'Handles MongoDB Extended JSON ($oid, $date)',
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
        title: 'Notion to Excel — Export & Convert Notion Databases',
        description: 'Export Notion databases to Excel offline. Convert API exports preserving properties, relations, and rollups. Free, no signup required.',
        h1: 'Notion to Excel Converter',
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
    },
    {
        slug: 'pipedrive-json-to-excel',
        platformName: 'Pipedrive',
        title: 'Pipedrive to Excel — Export CRM Data Free',
        description: 'Convert Pipedrive JSON exports to Excel. Flatten deal stages, contact details, and activity logs. 100% private, no upload.',
        h1: 'Pipedrive to Excel Converter',
        subheading: 'Export your Pipedrive CRM data to Excel for custom reporting and analysis.',
        content: {
            intro: 'Pipedrive exports contain nested deal stages, organization data, and activity histories. Standard tools break this structure. JsonExport flattens everything into clean, analysis-ready spreadsheets.',
            features: [
                'Flatten deal stages and pipeline data',
                'Extract contact and organization details',
                'Handle custom fields automatically',
                '100% private — no data upload'
            ]
        },
        faqs: [
            { question: 'How do I export Pipedrive data to Excel?', answer: 'Export your deals or contacts as JSON from the Pipedrive API, then paste the JSON here for instant Excel conversion.' },
            { question: 'Does this handle custom fields?', answer: 'Yes. All custom fields are automatically detected and included as separate Excel columns.' }
        ]
    },
    {
        slug: 'harvest-json-to-excel',
        platformName: 'Harvest',
        title: 'Harvest to Excel — Export Time Tracking Data',
        description: 'Convert Harvest time tracking JSON exports to Excel. Analyze hours, projects, and billing data in spreadsheets. Free and private.',
        h1: 'Harvest to Excel Converter',
        subheading: 'Turn Harvest time entries into Excel reports for invoicing and project analysis.',
        content: {
            intro: 'Harvest time tracking exports include nested project assignments, client data, and billing details. Our converter flattens this into clean rows for easy pivot table analysis.',
            features: [
                'Flatten time entries with project context',
                'Preserve client and task relationships',
                'Convert timestamps to Excel-compatible dates',
                '100% client-side processing'
            ]
        },
        faqs: [
            { question: 'Can I export Harvest timesheets to Excel?', answer: 'Yes. Use the Harvest API to export your time entries as JSON, then paste them here for instant Excel conversion.' },
            { question: 'Does this handle billable vs non-billable hours?', answer: 'Yes. The billable flag and hourly rates are preserved as separate columns in the output.' }
        ]
    },
    {
        slug: 'xero-json-to-excel',
        platformName: 'Xero',
        title: 'Xero to Excel — Export Accounting Data Free',
        description: 'Convert Xero API exports to Excel. Analyze invoices, contacts, and bank transactions in spreadsheets. Secure, private, no upload.',
        h1: 'Xero to Excel Converter',
        subheading: 'Export Xero accounting data to Excel for custom financial reporting.',
        content: {
            intro: 'Xero API responses contain nested line items, tracking categories, and contact details. Our converter flattens the structure so you can build custom financial reports in Excel.',
            features: [
                'Flatten invoice line items into rows',
                'Preserve tracking categories and tax details',
                'Handle nested contact information',
                '100% private — financial data stays local'
            ]
        },
        faqs: [
            { question: 'How do I get Xero data into Excel?', answer: 'Use the Xero API to export your data as JSON, then paste it here to convert to Excel instantly.' },
            { question: 'Is my financial data secure?', answer: 'Yes. All processing happens in your browser. No financial data is ever uploaded to any server.' }
        ]
    },
    {
        slug: 'intercom-json-to-excel',
        platformName: 'Intercom',
        title: 'Intercom to Excel — Export Chat & Ticket Data',
        description: 'Convert Intercom JSON exports to Excel. Analyze conversations, contacts, and support metrics in spreadsheets. Free and private.',
        h1: 'Intercom to Excel Converter',
        subheading: 'Export Intercom conversations and contacts to Excel for support analysis.',
        content: {
            intro: 'Intercom exports contain nested conversation parts, tags, and user attributes. This tool flattens them into structured rows so you can analyze support performance in Excel.',
            features: [
                'Flatten conversation threads and replies',
                'Extract user attributes and tags',
                'Handle custom data attributes',
                '100% client-side — customer data stays private'
            ]
        },
        faqs: [
            { question: 'Can I export Intercom conversations to Excel?', answer: 'Yes. Export your conversations via the Intercom API as JSON, then paste them here for Excel conversion.' },
            { question: 'Does this handle conversation parts?', answer: 'Yes. Each conversation part (message, note, assignment) is flattened into its own row with context preserved.' }
        ]
    },
    {
        slug: 'typeform-json-to-excel',
        platformName: 'Typeform',
        title: 'Typeform to Excel — Export Survey Responses',
        description: 'Convert Typeform JSON response exports to Excel. Analyze survey answers, scores, and completion data. Free, private, no upload.',
        h1: 'Typeform to Excel Converter',
        subheading: 'Turn Typeform survey responses into structured Excel data for analysis.',
        content: {
            intro: 'Typeform response exports contain nested answer objects with different types (text, choice, number). Our converter normalizes these into a clean spreadsheet with one row per response.',
            features: [
                'Normalize different answer types into columns',
                'Preserve question references and metadata',
                'Handle logic jump and hidden fields',
                '100% private processing'
            ]
        },
        faqs: [
            { question: 'How do I export Typeform responses to Excel?', answer: 'Use the Typeform API to export responses as JSON, then paste the data here for instant spreadsheet conversion.' },
            { question: 'Does this handle multi-choice answers?', answer: 'Yes. Multi-choice and ranking answers are expanded into readable column values.' }
        ]
    },
    {
        slug: 'dropbox-json-to-excel',
        platformName: 'Dropbox',
        title: 'Dropbox Metadata to Excel — Export File Listings',
        description: 'Convert Dropbox API file listings to Excel. Catalog files, folders, and sharing permissions in spreadsheets. Free and private.',
        h1: 'Dropbox to Excel Converter',
        subheading: 'Export Dropbox file metadata and folder structures to Excel.',
        content: {
            intro: 'Dropbox API responses include nested file metadata, sharing settings, and folder hierarchies. Our converter flattens this into a clean catalog you can sort and filter in Excel.',
            features: [
                'Flatten file and folder metadata',
                'Extract sharing permissions and links',
                'Handle nested folder structures',
                '100% client-side processing'
            ]
        },
        faqs: [
            { question: 'Can I export a list of all Dropbox files to Excel?', answer: 'Yes. Use the Dropbox API to list files and folders as JSON, then paste the result here for Excel conversion.' },
            { question: 'Does this show sharing permissions?', answer: 'Yes. Shared links, member access, and permission levels are extracted into dedicated columns.' }
        ]
    },
    {
        slug: 'mailchimp-json-to-excel',
        platformName: 'Mailchimp',
        title: 'Mailchimp to Excel — Export Campaigns & Contacts',
        description: 'Convert Mailchimp JSON exports to Excel. Analyze campaigns, subscriber lists, and email performance metrics. Free and private.',
        h1: 'Mailchimp to Excel Converter',
        subheading: 'Export Mailchimp campaign data and subscriber lists to Excel for analysis.',
        content: {
            intro: 'Mailchimp API data includes nested campaign statistics, merge fields, and subscriber segments. Our converter flattens these into clean Excel tables for marketing analysis.',
            features: [
                'Flatten campaign statistics and metrics',
                'Extract subscriber merge fields',
                'Handle segment and tag data',
                '100% private — subscriber data stays local'
            ]
        },
        faqs: [
            { question: 'How do I export Mailchimp contacts to Excel?', answer: 'Use the Mailchimp API to export your audience as JSON, then paste it here for instant Excel conversion.' },
            { question: 'Does this handle merge fields?', answer: 'Yes. All merge fields (FNAME, LNAME, custom fields) are automatically extracted into separate columns.' }
        ]
    },
    {
        slug: 'onedrive-json-to-excel',
        platformName: 'OneDrive',
        title: 'OneDrive to Excel — Export File Metadata',
        description: 'Convert OneDrive API file listings to Excel. Catalog files, permissions, and storage usage in spreadsheets. Free and private.',
        h1: 'OneDrive to Excel Converter',
        subheading: 'Export OneDrive file metadata and sharing details to Excel.',
        content: {
            intro: 'OneDrive Graph API responses contain nested file properties, sharing permissions, and storage quotas. Our converter turns this into a sortable, filterable file catalog in Excel.',
            features: [
                'Catalog files with size, type, and dates',
                'Extract sharing permissions and links',
                'Handle nested drive item properties',
                '100% client-side — no data uploaded'
            ]
        },
        faqs: [
            { question: 'Can I list all OneDrive files in Excel?', answer: 'Yes. Use the Microsoft Graph API to list your drive items as JSON, then convert them to Excel here.' },
            { question: 'Is this secure for corporate OneDrive data?', answer: 'Yes. All processing is 100% client-side. Your file metadata never leaves your browser.' }
        ]
    },
    {
        slug: 'timetonic-json-to-excel',
        platformName: 'TimeTonic',
        title: 'TimeTonic to Excel — Export Database Tables',
        description: 'Convert TimeTonic database exports to Excel. Flatten table structures and relationships for spreadsheet analysis. Free and private.',
        h1: 'TimeTonic to Excel Converter',
        subheading: 'Export TimeTonic database tables to Excel for reporting and analysis.',
        content: {
            intro: 'TimeTonic database exports contain nested table relationships and custom field types. Our converter flattens these into standard Excel tables for easy analysis.',
            features: [
                'Flatten table relationships',
                'Handle custom field types',
                'Preserve linked record references',
                '100% private processing'
            ]
        },
        faqs: [
            { question: 'Can I export TimeTonic tables to Excel?', answer: 'Yes. Export your TimeTonic data as JSON, then paste it here for instant Excel conversion.' },
            { question: 'Does this handle linked records?', answer: 'Yes. Linked records are resolved and included as readable column values.' }
        ]
    },
    {
        slug: 'google-my-business-json-to-excel',
        platformName: 'Google Business Profile',
        title: 'Google Business Profile to Excel — Export Reviews & Data',
        description: 'Convert Google Business Profile API data to Excel. Analyze reviews, locations, and insights in spreadsheets. Free and private.',
        h1: 'Google Business Profile to Excel Converter',
        subheading: 'Export Google Business Profile reviews and location data to Excel.',
        content: {
            intro: 'Google Business Profile API responses include nested review data, location attributes, and performance insights. Our converter flattens this for easy multi-location analysis in Excel.',
            features: [
                'Flatten review data with ratings and responses',
                'Extract location attributes and hours',
                'Handle multi-location datasets',
                '100% private — business data stays local'
            ]
        },
        faqs: [
            { question: 'Can I export Google reviews to Excel?', answer: 'Yes. Use the Google Business Profile API to fetch reviews as JSON, then paste them here for Excel conversion.' },
            { question: 'Does this handle multiple locations?', answer: 'Yes. Multi-location datasets are flattened with location identifiers preserved in each row.' }
        ]
    },
    {
        slug: 'clockify-json-to-excel',
        platformName: 'Clockify',
        title: 'Clockify to Excel — Export Time Entries Free',
        description: 'Convert Clockify time tracking data to Excel. Analyze time entries, projects, and team reports in spreadsheets. Free and private.',
        h1: 'Clockify to Excel Converter',
        subheading: 'Export Clockify time entries and reports to Excel for project analysis.',
        content: {
            intro: 'Clockify API exports include nested project, client, and tag information within each time entry. Our converter flattens this so you can create pivot tables and custom reports in Excel.',
            features: [
                'Flatten time entries with project context',
                'Extract tag and client information',
                'Convert durations to Excel-compatible formats',
                '100% client-side processing'
            ]
        },
        faqs: [
            { question: 'How do I export Clockify data to Excel?', answer: 'Use the Clockify API to export time entries as JSON, then paste the data here for instant conversion.' },
            { question: 'Does this handle team reports?', answer: 'Yes. Team member information is preserved as columns, making it easy to filter by team member in Excel.' }
        ]
    },
    {
        slug: 'calendly-json-to-excel',
        platformName: 'Calendly',
        title: 'Calendly to Excel — Export Bookings & Events',
        description: 'Convert Calendly scheduling data to Excel. Analyze bookings, event types, and invitee details in spreadsheets. Free and private.',
        h1: 'Calendly to Excel Converter',
        subheading: 'Export Calendly bookings and event data to Excel for scheduling analysis.',
        content: {
            intro: 'Calendly API data includes nested event details, invitee information, and scheduling metadata. Our converter flattens this into clean rows for easy reporting and analysis.',
            features: [
                'Flatten booking details with invitee info',
                'Extract event type configurations',
                'Handle cancellation and reschedule data',
                '100% private — scheduling data stays local'
            ]
        },
        faqs: [
            { question: 'Can I export Calendly bookings to Excel?', answer: 'Yes. Use the Calendly API to export your scheduled events as JSON, then paste them here for Excel conversion.' },
            { question: 'Does this include invitee details?', answer: 'Yes. Invitee names, emails, and custom question responses are extracted into their own columns.' }
        ]
    },
    {
        slug: 'quickbooks-json-to-excel',
        platformName: 'QuickBooks',
        title: 'QuickBooks to Excel — Export Financial Data',
        description: 'Convert QuickBooks JSON exports to Excel. Analyze invoices, expenses, and financial reports in spreadsheets. Secure and private.',
        h1: 'QuickBooks to Excel Converter',
        subheading: 'Export QuickBooks financial data to Excel for custom accounting reports.',
        content: {
            intro: 'QuickBooks API responses contain nested line items, customer references, and tax calculations. Our converter flattens these into structured Excel tables for custom financial analysis.',
            features: [
                'Flatten invoice line items and details',
                'Preserve customer and vendor references',
                'Handle tax line calculations',
                '100% private — financial data never leaves your browser'
            ]
        },
        faqs: [
            { question: 'How do I export QuickBooks data to Excel?', answer: 'Use the QuickBooks API to export invoices or reports as JSON, then paste the data here for instant Excel conversion.' },
            { question: 'Is my financial data secure?', answer: 'Yes. All processing happens in your browser. No financial data is ever sent to any server.' }
        ]
    }
];
