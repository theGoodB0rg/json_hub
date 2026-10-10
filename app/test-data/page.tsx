import { dummyDatasets } from '@/lib/dummy-data';
import Link from 'next/link';
import { Database, FileJson, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES, testDataPath } from '@/lib/routes';

// "dummy json" is this page's biggest query by a wide margin — 1,059
// impressions over 90 days at position 6.9, converting at 0.57%. Expected CTR
// at that position is roughly 3-4%, so the ranking is fine and the snippet is
// not: the old title led with "Free Dummy JSON Data & Files" and then said
// "Convert to Excel/CSV", which reads as a converter upsell to someone who
// searched for sample data. The title now answers the query directly and
// states the count, and the description leads with the two things that query
// actually wants — copy it, or download it — before mentioning conversion.
export const metadata: Metadata = buildPageMetadata({
    title: "Dummy JSON Data: 12 Free Sample Files to Copy or Download",
    description: "Realistic dummy JSON for testing — Stripe, Shopify, Jira, Salesforce, Slack, MongoDB and more. Copy the raw JSON, download the .json file, or preview it as a table. No sign-up, nothing uploaded.",
    canonicalPath: ROUTES.testData,
});

export default function TestDataIndex() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col items-center">
            {/* Header Section */}
            <div className="max-w-4xl mx-auto px-4 text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-4">
                    <Database className="h-4 w-4" />
                    <span>Developer Resources</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">Dummy JSON</span> Datasets
                </h1>

                <p className="text-xl text-muted-foreground w-full max-w-2xl mx-auto">
                    Realistic, deeply nested mock payloads from Stripe, Salesforce, Shopify, and more.
                    Perfect for testing ETL pipelines, webhooks, or spreadsheet scripts.
                </p>
            </div>

            {/* Datasets Grid */}
            <div className="max-w-6xl mx-auto px-4 mt-16 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dummyDatasets.map((dataset, idx) => (
                        <Link
                            href={testDataPath(dataset.slug)}
                            key={dataset.slug}
                            className={`group relative flex flex-col justify-between p-6 bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 animate-in fade-in slide-in-from-bottom-8`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                        {dataset.platform}
                                    </span>
                                    <FileJson className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                                    {dataset.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {dataset.description}
                                </p>
                            </div>
                            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-primary">
                                View JSON Dataset
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Global CTA */}
            <div className="max-w-4xl mx-auto px-4 mt-24 text-center space-y-6">
                <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20">
                    <h2 className="text-3xl font-bold mb-4">Have your own messy JSON?</h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                        Stop writing custom Python scripts to flatten API payloads. Drop your JSON into our secure, 100% client-side repair tool and get a perfect Excel file instantly.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 px-8 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-primary/25"
                    >
                        Repair Your JSON Now
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <span>100% Local Processing. Data never leaves your browser.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
