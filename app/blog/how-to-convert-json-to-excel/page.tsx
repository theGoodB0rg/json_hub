import { Metadata } from 'next';
import { FlatteningVisualizer } from '@/components/visualizations/FlatteningVisualizer';
import { BlogLayout } from '@/components/blog/BlogLayout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'How to Convert JSON to Excel (2026 Guide) - The Only Way That Actually Works',
    description: 'Stop struggling with Power Query. Learn the modern way to convert nested JSON data to Excel without coding. Visual guide + Free Tool.',
    alternates: {
        canonical: 'https://jsonexport.com/blog/how-to-convert-json-to-excel',
    },
    openGraph: {
        title: 'How to Convert JSON to Excel (2026 Guide)',
        description: 'Stop struggling with Power Query. Learn the modern way to convert nested JSON data to Excel without coding.',
        type: 'article',
        publishedTime: '2026-01-25T12:00:00.000Z',
        authors: ['JsonExport Team'],
    }
};

const guideTOC = [
    { id: 'intro', title: 'Why is JSON to Excel so hard?', level: 2 },
    { id: 'visualizing', title: 'Visual interactions: How Flattening Works', level: 2 },
    { id: 'method-1', title: 'Method 1: The Automated Way (Recommended)', level: 2 },
    { id: 'method-2', title: 'Method 2: Power Query (The Old Way)', level: 2 },
    { id: 'method-3', title: 'Method 3: Python (For Developers)', level: 2 },
    { id: 'faq', title: 'Frequently Asked Questions', level: 2 },
];

export default function GuidePage() {
    return (
        <BlogLayout
            toc={guideTOC}
            meta={{
                title: "How to Convert JSON to Excel (2026 Guide)",
                description: "You have a JSON file. You need an Excel spreadsheet. It sounds simple, but nested objects, arrays, and &apos;data munging&apos; make it a nightmare. Here is the definitive guide to solving it.",
                date: "January 25, 2026",
                readTime: "5 min read",
                author: {
                    name: "JsonExport Team",
                    role: "Data Engineering Experts"
                }
            }}
        >
            <div id="intro">
                <p className="lead text-xl">
                    If you&apos;ve ever tried to open a <code>.json</code> file in Excel, you&apos;ve seen the disaster: a blank screen, or worse, a single column of incomprehensible <code>[Object object]</code> text.
                </p>
                <p>
                    The problem isn&apos;t you—it&apos;s the <strong>structure mismatch</strong>. JSON is hierarchical (like a tree), while Excel is flat (like a grid). To bridge this gap, you need a process called <strong>Flattening</strong>.
                </p>
            </div>

            <div id="visualizing" className="my-12">
                <h2 className="text-3xl font-bold mb-6">Visualizing the Problem (and Solution)</h2>
                <p className="mb-6">
                    Instead of explaining &quot;keys&quot; and &quot;arrays&quot; with boring text, let&apos;s look at what actually happens when we flatten JSON data correctly.
                </p>
                <p className="mb-6 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900 text-sm">
                    <strong>👇 Interactive Demo:</strong> Click the button below to see how our engine transforms a nested user object into a clean Excel row.
                </p>

                {/* THE MOVING ILLUSTRATIVE ELEMENT */}
                <FlatteningVisualizer />

                <p className="text-sm text-muted-foreground text-center mt-4">
                    Notice how the nested <code>contact.email</code> field was automatically pulled up to become a column header? That&apos;s what you need.
                </p>
            </div>

            <div id="method-1" className="bg-muted/30 p-8 rounded-xl border my-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Recommended</span>
                    <h2 className="text-2xl font-bold m-0 border-none">Method 1: The Automated Way</h2>
                </div>

                <p>
                    We built <strong>JsonExport</strong> specifically because the other methods (below) are painful. This tool runs 100% in your browser, so your data never leaves your computer.
                </p>

                <div className="grid md:grid-cols-2 gap-6 my-8">
                    <div className="bg-background p-4 rounded-lg border">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            Pros
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>• Automatic Flattening (see above)</li>
                            <li>• Handles large files (50MB+)</li>
                            <li>• Privacy-first (Client-side)</li>
                            <li>• Free without signup</li>
                        </ul>
                    </div>
                    <div className="bg-background p-4 rounded-lg border">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            Cons
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>• It&apos;s a specialized tool (not Excel itself)</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <p className="text-center font-medium">Ready to try it?</p>
                    <Link href="/">
                        <Button size="lg" className="gap-2 text-lg px-8 h-12 shadow-xl shadow-primary/20">
                            Convert JSON Now <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div id="method-2">
                <h2>Method 2: Use Excel Power Query</h2>
                <p>
                    If you are an Excel power user, you can use the built-in &quot;Get Data&quot; feature. It works, but it requires many clicks.
                </p>
                <ol>
                    <li>Open Excel and go to the <strong>Data</strong> tab.</li>
                    <li>Select <strong>Get Data</strong> {'>'} <strong>From File</strong> {'>'} <strong>From JSON</strong>.</li>
                    <li>Click <strong>To Table</strong> in the Power Query Editor.</li>
                    <li>Manually click the &quot;Expand&quot; icon (two arrows) on every single column that contains an object.</li>
                </ol>
                <p>
                    <strong>The Verdict:</strong> It works for simple files, but if you have a massive API response with 50 levels of nesting, you will spend 20 minutes clicking &quot;Expand&quot;.
                </p>
            </div>

            <div id="method-3">
                <h2>Method 3: Use Python (Pandas)</h2>
                <p>
                    For developers, the <code>pandas</code> library is the standard.
                </p>
                <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`import pandas as pd
import json

# Load data
with open('data.json') as f:
    data = json.load(f)

# The magic function
df = pd.json_normalize(data)

# Export
df.to_excel('output.xlsx')`}</code>
                </pre>
                <p>
                    <strong>The Verdict:</strong> Flexible, but requires coding knowledge and setting up a Python environment.
                </p>
            </div>

            <div id="faq" className="mt-16">
                <h2>Frequently Asked Questions</h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold mb-2">How do I convert a JSON file to Excel for free?</h3>
                        <p>Use an online client-side converter like JsonExport. Avoid tools that ask you to upload your data to a server, as this is a security risk.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-2">Can Excel open JSON files directly?</h3>
                        <p>Not simply. You must use the &quot;Power Query&quot; import wizard. Simply double-clicking a .json file will not open it correctly in Excel.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-2">How to flatten nested JSON?</h3>
                        <p>Flattening involves creating new column names for nested keys (e.g., `user.address.city`). Our tool does this automatically using dot-notation.</p>
                    </div>
                </div>
            </div>

            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "HowTo",
                        "name": "How to Convert JSON to Excel",
                        "step": [
                            {
                                "@type": "HowToStep",
                                "name": "Open JsonExport",
                                "text": "Navigate to jsonexport.com in your web browser."
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Paste or Upload JSON",
                                "text": "Copy your JSON text or drag and drop your .json file into the editor."
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Download as Excel",
                                "text": "Click the Export button to save the flattened data as an .xlsx file."
                            }
                        ],
                        "totalTime": "PT1M",
                        "tool": [
                            {
                                "@type": "HowToTool",
                                "name": "JsonExport Converter"
                            }
                        ]
                    })
                }}
            />
        </BlogLayout>
    );
}
