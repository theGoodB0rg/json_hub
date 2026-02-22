import { dummyDatasets } from '@/lib/dummy-data';
import { converterPages } from '@/lib/platform-data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, FileSpreadsheet, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES, converterPath, testDataPath } from '@/lib/routes';

export async function generateStaticParams() {
    return dummyDatasets.map((dataset) => ({
        slug: dataset.slug,
    }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
    const dataset = dummyDatasets.find((d) => d.slug === params.slug);
    if (!dataset) return { title: 'Dataset Not Found' };

    return buildPageMetadata({
        title: `${dataset.title} - Download Free | JsonExport`,
        description: dataset.description,
        canonicalPath: testDataPath(dataset.slug),
    });
}

export default function DummyDataPage({ params }: { params: { slug: string } }) {
    const dataset = dummyDatasets.find((d) => d.slug === params.slug);
    const converterSlugs = new Set(converterPages.map((page) => page.slug));

    if (!dataset) {
        notFound();
    }

    const jsonString = JSON.stringify(dataset.data, null, 2);
    const converterHref = converterSlugs.has(dataset.converterSlug)
        ? converterPath(dataset.converterSlug)
        : ROUTES.jsonToExcel;

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-5xl mx-auto px-4 py-12 md:py-20 flex flex-col">

                {/* Back button */}
                <Link href={ROUTES.testData} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit mb-8">
                    <ArrowLeft className="h-4 w-4" />
                    Back to All Datasets
                </Link>

                <div className="space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                        <span className="uppercase tracking-wider">{dataset.platform} Test Payload</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                        {dataset.title}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                        {dataset.description} Use this payload to test JSON flattening, data loading pipelines, or database seeding.
                    </p>
                </div>

                {/* The "Honeypot" CTA - High urgency intercept */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    <div className="space-y-2 max-w-2xl">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-500" />
                            Struggling to convert your own JSON?
                        </h3>
                        <p className="text-muted-foreground">
                            Don&apos;t write another Python script. Use our free, 100% secure client-side tool to flatten any complex JSON export into a perfect Excel file in seconds.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-500 mt-2">
                            <ShieldCheck className="h-4 w-4" /> Data never leaves your browser window.
                        </div>
                    </div>
                    <Link
                        href={converterHref}
                        className="whitespace-nowrap inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-11 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm w-full md:w-auto"
                        data-testid="test-data-repair-cta"
                    >
                        Repair Your Export
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                    {/* JSON Display Area */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center justify-between bg-card border border-border/50 rounded-t-xl px-4 py-3 border-b-0">
                            <span className="font-mono text-sm font-semibold">payload.json</span>
                            <div className="flex gap-2">
                                <button className="text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors">
                                    <Download className="h-3.5 w-3.5" />
                                    Download JSON
                                </button>
                            </div>
                        </div>
                        <div className="bg-[#1e1e1e] rounded-b-xl border border-border/50 overflow-hidden mt-0!">
                            <pre className="p-6 text-sm text-[#d4d4d4] font-mono overflow-x-auto max-h-[600px] custom-scrollbar">
                                <code>{jsonString}</code>
                            </pre>
                        </div>
                    </div>

                    {/* Meta Sidebar */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl bg-muted/30 border border-border/50 space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">Dataset Size</h4>
                                <p className="text-sm text-muted-foreground">{jsonString.length} Bytes</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">Format</h4>
                                <p className="text-sm text-muted-foreground">JSON (Nested)</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">License</h4>
                                <p className="text-sm text-muted-foreground">MIT (Free to use)</p>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
