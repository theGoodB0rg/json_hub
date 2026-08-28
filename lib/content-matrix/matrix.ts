export interface ContentMatrixItem {
    slug: string;
    pluginId: string;
    sourceFormat: 'csv' | 'xml' | 'json';
    targetFormat: 'json' | 'excel' | 'csv';
    platformName: string;
    title: string;
    description: string;
    h1: string;
    subheading: string;
    tldr: string;
    badgeText: string;
    accentColor: string;
    sampleData: string;
    content: {
        intro: string;
        features: string[];
    };
    howTo: {
        step1: string;
        step2: string;
        step3: string;
    };
    faqs: {
        question: string;
        answer: string;
    }[];
    comparisons?: {
        feature: string;
        jsonExport: string;
        nativeTool: string;
        pythonScript: string;
    }[];
}

export const conversionMatrix: ContentMatrixItem[] = [
    {
        slug: 'csv-to-json',
        pluginId: 'csv-to-json',
        sourceFormat: 'csv',
        targetFormat: 'json',
        platformName: 'CSV',
        title: 'Convert CSV to JSON Online — Auto-Detect Delimiters & Types',
        description: 'Convert CSV to JSON instantly in your browser. Automatic delimiter detection (comma, semicolon, tab), smart type casting (numbers, booleans), and RFC-4180 compliance.',
        h1: 'Convert CSV to JSON Online',
        subheading: 'Turn comma or tab-separated data into formatted JSON objects instantly with zero server uploads.',
        tldr: 'Paste your CSV into the editor or drag and drop a file. The converter automatically detects delimiters, infers numbers and booleans, and generates clean JSON with instant Copy & Download.',
        badgeText: 'RFC-4180 Compliant',
        accentColor: 'from-emerald-500/20 to-teal-500/20',
        sampleData: 'id,name,role,department,salary,isActive\n101,"Miller, Sarah",Lead Architect,Engineering,145000,true\n102,"Chen, David",Senior Data Engineer,Analytics,128000,true\n103,"Kowalski, Elena",Product Manager,Product,115000,false',
        content: {
            intro: 'CSV data is the universal standard for spreadsheet exports, but modern applications and APIs require structured JSON. Online upload tools expose your sensitive data to remote servers. JsonExport converts CSV to JSON 100% client-side with automatic delimiter detection and strict type inference.',
            features: [
                'Auto-detects delimiters: Comma (,), Semicolon (;), Tab (\\t), and Pipe (|)',
                'Smart Type Inference: Casts integers, floats, booleans, and nulls automatically',
                'Handles escaped quotes, multiline values, and complex RFC-4180 edge cases',
                '100% Private & Secure: Zero server calls, works completely offline',
            ],
        },
        howTo: {
            step1: 'Paste or upload your CSV / TSV file into the editor.',
            step2: 'The engine instantly parses columns and infers data types.',
            step3: 'Click "Convert to JSON" to copy or download your formatted JSON file.',
        },
        faqs: [
            {
                question: 'Does this handle semicolon (;) or tab (\\t) separated files?',
                answer: 'Yes. Our smart parser scans row consistency across multiple delimiters and automatically selects the correct delimiter without requiring manual configuration.',
            },
            {
                question: 'How does it handle multiline text and escaped quotes in CSV?',
                answer: 'The parser strictly adheres to RFC-4180 standards. Double quotes and newline characters enclosed within quoted fields are preserved perfectly.',
            },
            {
                question: 'Are numbers and booleans converted or kept as strings?',
                answer: 'By default, valid numbers and boolean values (true/false) are cast into real JSON primitives, while identifiers with leading zeros (e.g. zip codes) are safely preserved as strings.',
            },
            {
                question: 'Is there a file size limit for CSV conversion?',
                answer: 'Because processing happens entirely in your browser memory, JsonExport smoothly handles files up to 50MB+ without network latency or server timeouts.',
            },
        ],
    },
    {
        slug: 'xml-to-excel',
        pluginId: 'xml-to-excel',
        sourceFormat: 'xml',
        targetFormat: 'excel',
        platformName: 'XML',
        title: 'Convert XML to Excel (XLSX) Online — Flatten XML Hierarchies',
        description: 'Convert XML files to Microsoft Excel (.xlsx) spreadsheets. Flattens nested tags, extracts element attributes, and eliminates [object Object] errors. 100% private.',
        h1: 'Convert XML to Excel (XLSX)',
        subheading: 'Turn complex XML documents into clean, structured Excel tables without Power Query coding.',
        tldr: 'Paste your XML text or drop an .xml file below. Our engine unwraps document roots, flattens element hierarchies, and extracts attributes into clean Excel columns.',
        badgeText: 'Auto-Hierarchy Unwrapping',
        accentColor: 'from-amber-500/20 to-orange-500/20',
        sampleData: '<?xml version="1.0" encoding="UTF-8"?>\n<catalog company="Global Logistics">\n  <shipment id="SH-9001" status="In Transit">\n    <origin country="USA">New York</origin>\n    <destination country="DE">Berlin</destination>\n    <weight unit="kg">450.5</weight>\n    <insured>true</insured>\n  </shipment>\n  <shipment id="SH-9002" status="Delivered">\n    <origin country="JP">Tokyo</origin>\n    <destination country="UK">London</destination>\n    <weight unit="kg">120.0</weight>\n    <insured>false</insured>\n  </shipment>\n</catalog>',
        content: {
            intro: 'XML files with nested tags and element attributes are notoriously difficult to analyze in Excel. Native Excel imports often create dozens of disconnected sub-tables or produce unreadable XML maps. JsonExport flattens the XML tree into a unified, clean spreadsheet in seconds.',
            features: [
                'Extracts both XML element values and tag attributes (e.g. `@_id`) into columns',
                'Auto-detects repeated node collections and maps them to spreadsheet rows',
                'Generates real Microsoft Excel (.xlsx) files with preserved data types',
                'No server uploads: Compliant with strict enterprise privacy and GDPR requirements',
            ],
        },
        howTo: {
            step1: 'Paste XML code or drag and drop your .xml file.',
            step2: 'Preview the flattened data table and inspect inferred column headers.',
            step3: 'Click "Export to Excel" to download a clean .xlsx file.',
        },
        faqs: [
            {
                question: 'How are XML tag attributes represented in the Excel sheet?',
                answer: 'Tag attributes are prefixed with `@_` (e.g., `@_id`, `@_status`) and assigned to dedicated columns alongside child elements.',
            },
            {
                question: 'Can this convert large XML files with multiple nested levels?',
                answer: 'Yes. Nested sub-elements are flattened using standard dot notation (e.g., `origin.country`), ensuring every data point is accessible in a single row.',
            },
            {
                question: 'Do I need Excel Power Query or VBA scripts installed?',
                answer: 'No. The conversion happens entirely in your web browser, generating a ready-to-open .xlsx file that works in Microsoft Excel, Google Sheets, or LibreOffice.',
            },
        ],
    },
    {
        slug: 'xml-to-json',
        pluginId: 'xml-to-json',
        sourceFormat: 'xml',
        targetFormat: 'json',
        platformName: 'XML',
        title: 'Convert XML to JSON Online — Preserves Attributes & Arrays',
        description: 'Convert XML to JSON online with support for tag attributes, nested structures, and repeated elements converted to clean JSON arrays. 100% private.',
        h1: 'Convert XML to JSON Online',
        subheading: 'Transform XML feeds, SOAP responses, and config files into modern JSON objects.',
        tldr: 'Paste your XML below to convert it into formatted JSON. Repeated tags are automatically bundled into arrays and attributes are cleanly mapped.',
        badgeText: 'Array & Attribute Aware',
        accentColor: 'from-blue-500/20 to-indigo-500/20',
        sampleData: '<?xml version="1.0" encoding="UTF-8"?>\n<project name="JsonExport" version="2.0">\n  <maintainers>\n    <user role="admin">\n      <name>Alice Johnson</name>\n      <email>alice@example.com</email>\n    </user>\n    <user role="contributor">\n      <name>Bob Martin</name>\n      <email>bob@example.com</email>\n    </user>\n  </maintainers>\n  <settings>\n    <offlineMode>true</offlineMode>\n    <maxMemoryMB>512</maxMemoryMB>\n  </settings>\n</project>',
        content: {
            intro: 'Modern software architectures and REST APIs rely on JSON, but legacy systems, SOAP endpoints, and syndication feeds still deliver XML. JsonExport bridges this gap with high-speed client-side XML to JSON conversion.',
            features: [
                'Converts repeated XML tags into proper JSON arrays automatically',
                'Maps tag attributes cleanly alongside child element properties',
                'Formatted & minified JSON output options with one-click copy',
                'Zero telemetry on payload contents: 100% private and offline capable',
            ],
        },
        howTo: {
            step1: 'Paste XML string or drop an XML file.',
            step2: 'The parser structures the hierarchy into standard JSON syntax.',
            step3: 'Copy the JSON to clipboard or download as a .json file.',
        },
        faqs: [
            {
                question: 'How are repeated sibling tags handled?',
                answer: 'When multiple sibling elements share the same tag name (e.g. `<user>`), our parser automatically groups them into a JavaScript array `[ ... ]`.',
            },
            {
                question: 'Is XML CDATA supported?',
                answer: 'Yes. CDATA sections are extracted and treated as standard text content without escaping errors.',
            },
            {
                question: 'Can I use this for SOAP API responses?',
                answer: 'Yes. Simply paste the SOAP XML payload; headers and body elements will be converted into navigable JSON objects.',
            },
        ],
    },
    {
        slug: 'csv-to-excel',
        pluginId: 'csv-to-excel',
        sourceFormat: 'csv',
        targetFormat: 'excel',
        platformName: 'CSV',
        title: 'CSV to Excel Converter (XLSX) — Fix Corrupted Leading Zeros',
        description: 'Convert CSV to real Microsoft Excel (.xlsx) files. Prevents dropped leading zeros, incorrect date conversions, and UTF-8 encoding corruption. Free & private.',
        h1: 'Convert CSV to Excel (XLSX)',
        subheading: 'Export CSV into native Excel spreadsheets without corrupted dates or lost leading zeros.',
        tldr: 'Drop your CSV file to convert it into a true .xlsx workbook. Preserves UTF-8 special characters and prevents Excel auto-formatting issues.',
        badgeText: 'Preserves Special Characters & Formats',
        accentColor: 'from-green-500/20 to-emerald-500/20',
        sampleData: 'AccountID,AccountName,Balance,Currency,LastAudit,Status\n0019283,"Starlight Holdings, Inc.",54200.75,USD,2024-03-01,Verified\n0048192,"Nordic Ventures ApS",120500.00,EUR,2024-03-05,Verified\n0092104,"Tokyo Digital K.K.",8430000,JPY,2024-03-10,Pending',
        content: {
            intro: 'Opening raw CSV files directly in Microsoft Excel often causes data corruption: leading zeros are stripped from account numbers, dates are misinterpreted, and non-ASCII characters break. Converting CSV to native .xlsx before opening fixes these issues permanently.',
            features: [
                'Generates authentic binary .xlsx files (not renamed CSV text files)',
                'Preserves leading zeros on ID codes, phone numbers, and zip codes',
                'Maintains UTF-8 international character encoding flawlessly',
                '100% private: Converts files locally in your browser memory',
            ],
        },
        howTo: {
            step1: 'Drop your CSV or TSV file into the upload zone.',
            step2: 'Verify columns and data types in the interactive grid.',
            step3: 'Click "Export to Excel" to download a clean .xlsx workbook.',
        },
        faqs: [
            {
                question: 'Why not just open the CSV file in Excel directly?',
                answer: 'Excel often strips leading zeros (turning "00123" into "123") and mutates date strings when opening raw CSVs. Generating a real .xlsx workbook preserves the exact string data.',
            },
            {
                question: 'Does this support TSV (Tab-Separated Values)?',
                answer: 'Yes. Our engine detects tab delimiters automatically and creates structured columns accordingly.',
            },
        ],
    },
    {
        slug: 'jira-csv-to-json',
        pluginId: 'csv-to-json',
        sourceFormat: 'csv',
        targetFormat: 'json',
        platformName: 'Jira',
        title: 'Jira CSV to JSON Converter — Flatten Sprints & Custom Fields',
        description: 'Convert Jira issue export CSVs to clean, structured JSON. Automatically handles multi-value custom fields, sprint histories, and multiline descriptions. 100% private.',
        h1: 'Jira CSV to JSON Converter',
        subheading: 'Turn Jira issue exports into clean JSON without broken multiline descriptions or messy sprint strings.',
        tldr: 'Export issues from Jira as CSV and paste them below. Our parser handles duplicate column names, multiline descriptions, and custom fields to produce structured JSON.',
        badgeText: 'Jira Export Optimized',
        accentColor: 'from-sky-500/20 to-blue-600/20',
        sampleData: 'Issue key,Summary,Issue Type,Status,Priority,Story Points,Sprint,Description\nPROJ-101,"Implement OAuth2 PKCE Flow",Story,In Progress,High,5,"Sprint 14, Sprint 15","Need to update auth flow to support mobile redirect URLs.\nRequires testing with iOS and Android deep links."\nPROJ-102,"Fix memory leak in background worker",Bug,Done,Highest,8,"Sprint 14","Worker threads not releasing buffer pointers on batch timeout."\nPROJ-103,"Design unified converter interface",Task,To Do,Medium,3,"Sprint 15","Create extensible plugin registry for data transformation."',
        content: {
            intro: 'Jira CSV exports frequently contain complex data structures like multiple sprint histories, multiline descriptions with unescaped line breaks, and duplicate custom field headers. JsonExport parses Jira CSV exports cleanly into structured JSON without data truncation.',
            features: [
                'Deduplicates repeated Jira custom field headers automatically',
                'Preserves multiline issue descriptions and markdown formatting',
                'Infers story point numbers and sprint array values',
                'Ideal for feeding Jira data into analytics pipelines and BI dashboards',
            ],
        },
        howTo: {
            step1: 'Export your Jira filter or board as a CSV file.',
            step2: 'Drop the Jira CSV file into the editor.',
            step3: 'Click "Convert to JSON" to download your clean JSON dataset.',
        },
        faqs: [
            {
                question: 'How does this handle duplicate headers like multiple "Sprint" columns?',
                answer: 'Jira exports multiple Sprint or Component columns with identical names. Our parser deduplicates them (e.g. `Sprint`, `Sprint_1`) so all values are preserved in the JSON output.',
            },
            {
                question: 'Will long descriptions with newlines break the JSON structure?',
                answer: 'No. Our RFC-4180 tokenizer handles nested quotes and line breaks within cells seamlessly.',
            },
            {
                question: 'Can I convert this Jira JSON back to Excel or database formats?',
                answer: 'Yes. Once converted, you can switch between JSON, CSV, and Excel export formats anytime.',
            },
        ],
    },
    {
        slug: 'shopify-xml-to-excel',
        pluginId: 'xml-to-excel',
        sourceFormat: 'xml',
        targetFormat: 'excel',
        platformName: 'Shopify',
        title: 'Shopify XML to Excel (XLSX) — Flatten Product & Inventory Feeds',
        description: 'Convert Shopify XML product catalogs, inventory feeds, and order exports into Excel spreadsheets. Flattens variants, tags, and pricing attributes cleanly.',
        h1: 'Shopify XML to Excel Converter',
        subheading: 'Convert Shopify product feeds and XML exports into clean Excel sheets without code.',
        tldr: 'Paste your Shopify XML product feed or order export below. Variants, line items, and pricing attributes are flattened into ready-to-analyze Excel rows.',
        badgeText: 'Shopify Feed Compatible',
        accentColor: 'from-lime-500/20 to-green-600/20',
        sampleData: '<?xml version="1.0" encoding="UTF-8"?>\n<products store="Urban Styles">\n  <product id="SHPF-1001" handle="vintage-denim-jacket">\n    <title>Vintage Denim Jacket</title>\n    <vendor>Urban Styles</vendor>\n    <productType>Apparel</productType>\n    <variants>\n      <variant sku="VJ-S" price="89.99" inventory="14">Small / Blue</variant>\n      <variant sku="VJ-M" price="89.99" inventory="22">Medium / Blue</variant>\n    </variants>\n    <tags>denim, vintage, outerwear</tags>\n  </product>\n  <product id="SHPF-1002" handle="leather-crossbody-bag">\n    <title>Leather Crossbody Bag</title>\n    <vendor>Artisan Goods</vendor>\n    <productType>Accessories</productType>\n    <variants>\n      <variant sku="LB-01" price="120.00" inventory="8">Tan Leather</variant>\n    </variants>\n    <tags>leather, bag, handcrafted</tags>\n  </product>\n</products>',
        content: {
            intro: 'E-commerce operations frequently export Shopify inventory and product catalogs in XML. Navigating nested variant tags and inventory attributes manually in spreadsheets is time-consuming. JsonExport unwraps Shopify product catalogs directly into Excel.',
            features: [
                'Flattens nested product variants and inventory counts into distinct columns',
                'Preserves SKU codes, currency amounts, and product handles accurately',
                'Outputs formatted .xlsx files ready for inventory reconciliation',
                '100% private: Your confidential sales and supplier data stays in your browser',
            ],
        },
        howTo: {
            step1: 'Paste your Shopify product XML feed or order export.',
            step2: 'Review the flattened variant columns and product properties in the grid.',
            step3: 'Click "Export to Excel" to download your spreadsheet.',
        },
        faqs: [
            {
                question: 'Does this handle nested product variants and pricing?',
                answer: 'Yes. Variant properties like SKU, inventory count, and price are flattened into accessible spreadsheet columns.',
            },
            {
                question: 'Is it safe to paste customer order XML feeds here?',
                answer: 'Yes. All data processing occurs locally in your browser with zero server uploads, making it fully compliant with GDPR and e-commerce data privacy standards.',
            },
        ],
    },
];

export function getMatrixItem(slug: string): ContentMatrixItem | undefined {
    return conversionMatrix.find((item) => item.slug === slug);
}

export function getAllMatrixSlugs(): string[] {
    return conversionMatrix.map((item) => item.slug);
}
