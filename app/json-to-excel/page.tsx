import { ConverterApp } from "@/components/ConverterApp";
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';
import { FAQSchema } from '@/components/FAQSchema';
import Link from 'next/link';

export const metadata: Metadata = buildPageMetadata({
    title: 'JSON to Excel Converter — Auto-Flatten Nested JSON to XLSX',
    description: 'Convert nested JSON to formatted Excel (.xlsx) spreadsheets instantly. Automatically unwinds arrays into rows and fixes [object Object] errors online.',
    canonicalPath: ROUTES.jsonToExcel,
});

const faqs = [
    {
        question: 'How do I convert JSON to Excel?',
        answer: 'Paste your JSON data into the editor above, or drag and drop a .json file. Click "Export to Excel" to download a formatted .xlsx file instantly. No signup or upload required.'
    },
    {
        question: 'Can I convert JSON to XLSX online for free?',
        answer: 'Yes. JsonExport is 100% free with no limits on file size or conversions. Your data is processed entirely in your browser — nothing is uploaded to any server.'
    },
    {
        question: 'How do I open a JSON file in Excel?',
        answer: 'You cannot open a JSON file directly in Excel without converting it first. Use this tool to convert your JSON to an .xlsx file, then open it in Excel. Alternatively, Excel\'s Power Query can import JSON but struggles with nested data.'
    },
    {
        question: 'Does this handle nested JSON and arrays?',
        answer: 'Yes. Our Smart Flattener automatically detects nested objects and arrays, converting them into separate columns using dot notation (e.g., "address.city"). Arrays are expanded into individual rows.'
    },
    {
        question: 'What is the maximum JSON file size supported?',
        answer: 'JsonExport handles files up to 100MB+ directly in your browser. For very large files, processing happens in Web Workers to prevent UI freezing.'
    },
    {
        question: 'Why does my JSON show [object Object] in Excel?',
        answer: 'This happens when Excel encounters nested JSON objects it cannot display. JsonExport solves this by flattening nested structures into readable columns before generating the Excel file.'
    },
    {
        question: 'Is my data secure when converting JSON to Excel?',
        answer: 'Yes. JsonExport processes everything 100% client-side in your browser. Your JSON data is never sent to any server. You can even disconnect from the internet after loading the page.'
    },
    {
        question: 'Can I convert JSON to CSV instead of Excel?',
        answer: 'Yes. JsonExport supports export to Excel (.xlsx), CSV, and HTML table formats. Use the format selector above the export button to choose your preferred format.'
    },
    {
        question: 'How do I convert a large JSON file to Excel without crashing?',
        answer: 'Most online converters crash on large files because they upload data to servers. JsonExport processes files locally using Web Workers, handling 50MB+ files smoothly without memory errors.'
    },
    {
        question: 'Can I convert JSON from APIs like Stripe, Salesforce, or HubSpot?',
        answer: 'Absolutely. JsonExport is designed to handle real-world API responses with deeply nested metadata. We have dedicated converter pages for Stripe, Salesforce, HubSpot, Slack, and 20+ other platforms.'
    },
];

export default function JsonToExcelPage() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        Convert <span className="text-green-600 dark:text-green-500">JSON to Excel</span> <br />
                        Online — Free &amp; Private.
                    </h1>
                }
                subheading="The fastest way to turn JSON data into formatted Excel spreadsheets. Handles nested objects, arrays, and 100MB+ files — all processed privately in your browser."
            />

            {/* How It Works */}
            <section className="container mx-auto px-4 py-16 max-w-5xl">
                <h2 className="text-3xl font-bold mb-8 text-center">How to Convert JSON to Excel in 3 Steps</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-6 rounded-xl border border-border/40 bg-card">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                        <h3 className="font-semibold text-lg mb-2">Paste or Drop JSON</h3>
                        <p className="text-muted-foreground text-sm">Paste your JSON data into the editor, or drag and drop a .json file. Works with any valid JSON — API responses, database exports, config files.</p>
                    </div>
                    <div className="text-center p-6 rounded-xl border border-border/40 bg-card">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                        <h3 className="font-semibold text-lg mb-2">Preview &amp; Configure</h3>
                        <p className="text-muted-foreground text-sm">See your data in a live table preview. Toggle Smart Flattening to handle nested objects. Select which columns to include in the export.</p>
                    </div>
                    <div className="text-center p-6 rounded-xl border border-border/40 bg-card">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                        <h3 className="font-semibold text-lg mb-2">Download Excel File</h3>
                        <p className="text-muted-foreground text-sm">Click Export to download a formatted .xlsx file. Open it in Microsoft Excel, Google Sheets, or LibreOffice Calc. Data types are preserved.</p>
                    </div>
                </div>
            </section>

            {/* Why JsonExport */}
            <section className="container mx-auto px-4 py-16 max-w-5xl border-t border-border/40">
                <h2 className="text-3xl font-bold mb-8">Why Use JsonExport for JSON to Excel Conversion?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-lg border border-border/40 bg-card">
                        <h3 className="font-semibold mb-2">{"\uD83D\uDD12"} 100% Private — No Upload</h3>
                        <p className="text-muted-foreground text-sm">Unlike other online converters, your JSON data never leaves your device. Everything is processed in your browser using client-side JavaScript.</p>
                    </div>
                    <div className="p-5 rounded-lg border border-border/40 bg-card">
                        <h3 className="font-semibold mb-2">{"\uD83E\uDDEA"} Smart Nested Data Handling</h3>
                        <p className="text-muted-foreground text-sm">No more [object Object] in your spreadsheets. Our flattener converts nested JSON objects and arrays into clean, readable Excel columns.</p>
                    </div>
                    <div className="p-5 rounded-lg border border-border/40 bg-card">
                        <h3 className="font-semibold mb-2">{"\uD83D\uDCE6"} Large File Support (100MB+)</h3>
                        <p className="text-muted-foreground text-sm">Process massive JSON files without crashes or memory errors. Web Worker technology keeps the interface responsive even with huge datasets.</p>
                    </div>
                    <div className="p-5 rounded-lg border border-border/40 bg-card">
                        <h3 className="font-semibold mb-2">{"\u26A1"} Instant Results — No Signup</h3>
                        <p className="text-muted-foreground text-sm">No account needed. No email required. Just paste your JSON and download Excel. Works offline after the page loads.</p>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="container mx-auto px-4 py-16 max-w-5xl border-t border-border/40">
                <h2 className="text-3xl font-bold mb-8">JSON to Excel: Tool Comparison</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-border/40 rounded-lg">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="p-3 text-left font-semibold">Feature</th>
                                <th className="p-3 text-center font-semibold text-primary">JsonExport</th>
                                <th className="p-3 text-center font-semibold">Power Query</th>
                                <th className="p-3 text-center font-semibold">Python Pandas</th>
                                <th className="p-3 text-center font-semibold">Online Upload Tools</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-border/40">
                                <td className="p-3">Privacy (No Upload)</td>
                                <td className="p-3 text-center text-green-600 font-semibold">Yes</td>
                                <td className="p-3 text-center text-green-600">Yes</td>
                                <td className="p-3 text-center text-green-600">Yes</td>
                                <td className="p-3 text-center text-red-500">No</td>
                            </tr>
                            <tr className="border-t border-border/40 bg-muted/20">
                                <td className="p-3">No Coding Required</td>
                                <td className="p-3 text-center text-green-600 font-semibold">Yes</td>
                                <td className="p-3 text-center text-yellow-600">M Language</td>
                                <td className="p-3 text-center text-red-500">Python</td>
                                <td className="p-3 text-center text-green-600">Yes</td>
                            </tr>
                            <tr className="border-t border-border/40">
                                <td className="p-3">Handles Nested JSON</td>
                                <td className="p-3 text-center text-green-600 font-semibold">Smart Flatten</td>
                                <td className="p-3 text-center text-yellow-600">Manual Steps</td>
                                <td className="p-3 text-center text-green-600">With Code</td>
                                <td className="p-3 text-center text-red-500">Breaks</td>
                            </tr>
                            <tr className="border-t border-border/40 bg-muted/20">
                                <td className="p-3">File Size Limit</td>
                                <td className="p-3 text-center text-green-600 font-semibold">100MB+</td>
                                <td className="p-3 text-center">Depends on RAM</td>
                                <td className="p-3 text-center text-green-600">Unlimited</td>
                                <td className="p-3 text-center text-red-500">5-10MB</td>
                            </tr>
                            <tr className="border-t border-border/40">
                                <td className="p-3">Cost</td>
                                <td className="p-3 text-center text-green-600 font-semibold">Free</td>
                                <td className="p-3 text-center">Excel License</td>
                                <td className="p-3 text-center text-green-600">Free</td>
                                <td className="p-3 text-center text-yellow-600">Freemium</td>
                            </tr>
                            <tr className="border-t border-border/40 bg-muted/20">
                                <td className="p-3">Setup Time</td>
                                <td className="p-3 text-center text-green-600 font-semibold">0 seconds</td>
                                <td className="p-3 text-center">10-30 min</td>
                                <td className="p-3 text-center text-red-500">Hours</td>
                                <td className="p-3 text-center text-green-600">0 seconds</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Use Cases */}
            <section className="container mx-auto px-4 py-16 max-w-5xl border-t border-border/40">
                <h2 className="text-3xl font-bold mb-8">Popular JSON to Excel Use Cases</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-lg border border-border/40">
                        <h3 className="font-semibold mb-2">API Response Analysis</h3>
                        <p className="text-muted-foreground text-sm">Convert REST API responses from Stripe, Salesforce, HubSpot, and other services into Excel for reporting and data analysis.</p>
                    </div>
                    <div className="p-5 rounded-lg border border-border/40">
                        <h3 className="font-semibold mb-2">Database Export Processing</h3>
                        <p className="text-muted-foreground text-sm">Flatten MongoDB, PostgreSQL, or Firebase JSON exports into clean spreadsheets for business stakeholders.</p>
                    </div>
                    <div className="p-5 rounded-lg border border-border/40">
                        <h3 className="font-semibold mb-2">Log File Analysis</h3>
                        <p className="text-muted-foreground text-sm">Transform JSON log files from applications and servers into sortable, filterable Excel tables for debugging and monitoring.</p>
                    </div>
                </div>
            </section>

            {/* Related Tools */}
            <section className="container mx-auto px-4 py-16 max-w-5xl border-t border-border/40">
                <h2 className="text-2xl font-bold mb-6">Related Conversion Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/json-to-csv" className="p-4 rounded-lg border border-border/40 hover:border-primary/50 transition-colors">
                        <h3 className="font-semibold text-primary">JSON to CSV Converter</h3>
                        <p className="text-sm text-muted-foreground">Convert JSON to CSV format for databases and data imports.</p>
                    </Link>
                    <Link href="/converters/stripe-json-to-excel" className="p-4 rounded-lg border border-border/40 hover:border-primary/50 transition-colors">
                        <h3 className="font-semibold text-primary">Stripe to Excel</h3>
                        <p className="text-sm text-muted-foreground">Export Stripe charges, invoices, and customers to Excel.</p>
                    </Link>
                    <Link href="/converters/hubspot-json-to-excel" className="p-4 rounded-lg border border-border/40 hover:border-primary/50 transition-colors">
                        <h3 className="font-semibold text-primary">HubSpot to Excel</h3>
                        <p className="text-sm text-muted-foreground">Convert HubSpot CRM data to clean Excel spreadsheets.</p>
                    </Link>
                    <Link href="/converters/salesforce-json-to-excel" className="p-4 rounded-lg border border-border/40 hover:border-primary/50 transition-colors">
                        <h3 className="font-semibold text-primary">Salesforce to Excel</h3>
                        <p className="text-sm text-muted-foreground">Export Salesforce contacts, opportunities, and reports.</p>
                    </Link>
                    <Link href="/converters/trello-json-to-csv" className="p-4 rounded-lg border border-border/40 hover:border-primary/50 transition-colors">
                        <h3 className="font-semibold text-primary">Trello to CSV/Excel</h3>
                        <p className="text-sm text-muted-foreground">Convert Trello board exports for migration or analysis.</p>
                    </Link>
                    <Link href="/converters/slack-json-to-csv" className="p-4 rounded-lg border border-border/40 hover:border-primary/50 transition-colors">
                        <h3 className="font-semibold text-primary">Slack to CSV</h3>
                        <p className="text-sm text-muted-foreground">Export Slack workspace messages and history.</p>
                    </Link>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="container mx-auto px-4 py-16 max-w-5xl border-t border-border/40">
                <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border border-border/40 rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                            <p className="text-muted-foreground">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Schema for rich snippets */}
            <FAQSchema faqs={faqs} />
        </>
    );
}
