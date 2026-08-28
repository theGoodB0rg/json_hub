import { dummyDatasets } from '@/lib/dummy-data';
import { converterPages } from '@/lib/platform-data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES, converterPath, testDataPath, toAbsoluteUrl } from '@/lib/routes';
import { TestDataActions } from '@/components/test-data/TestDataActions';

export async function generateStaticParams() {
    return dummyDatasets.map((dataset) => ({
        slug: dataset.slug,
    }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
    const dataset = dummyDatasets.find((d) => d.slug === params.slug);
    if (!dataset) return { title: 'Dataset Not Found' };

    return buildPageMetadata({
        title: `${dataset.title} (Download & Convert to Excel) | JsonExport`,
        description: `${dataset.description} Download raw JSON or convert into formatted Excel/CSV tables in 1-click.`,
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

    // Schema.org Dataset Markup
    const datasetSchema = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: dataset.title,
        description: dataset.description,
        url: toAbsoluteUrl(testDataPath(dataset.slug)),
        keywords: [
            dataset.platform,
            'JSON Dataset',
            'Dummy JSON',
            'Mock JSON',
            'Test Data',
            'JSON to Excel',
        ],
        creator: {
            '@type': 'Organization',
            name: 'JsonExport',
            url: 'https://jsonexport.com',
        },
        distribution: [
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/json',
                contentUrl: toAbsoluteUrl(testDataPath(dataset.slug)),
            },
        ],
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-5xl mx-auto px-4 py-12 md:py-20 flex flex-col">
                {/* Back button */}
                <Link
                    href={ROUTES.testData}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to All Datasets
                </Link>

                <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                        <Database className="h-3.5 w-3.5" />
                        <span className="uppercase tracking-wider">{dataset.platform} Test Payload</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                        {dataset.title}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                        {dataset.description} Download this payload or convert it directly into Excel spreadsheets in 1 click.
                    </p>
                </div>

                {/* 1-Click Conversion Bridge CTA */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 md:p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    <div className="space-y-2 max-w-2xl">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-500" />
                            Convert this {dataset.platform} JSON to Excel or CSV
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Instantly flatten and preview these records in multi-column tables. Auto-unwinds nested objects without writing Python or Power Query.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-500 mt-2">
                            <ShieldCheck className="h-4 w-4" /> 100% Client-Side in Your Browser (Zero Data Upload)
                        </div>
                    </div>
                    <Link
                        href={converterHref}
                        className="whitespace-nowrap inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-11 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm w-full md:w-auto"
                        data-testid="test-data-repair-cta"
                    >
                        Convert to Excel
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                    {/* JSON Display Area */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/50 rounded-t-xl px-4 py-3 border-b-0">
                            <span className="font-mono text-sm font-semibold">{dataset.slug}.json</span>
                            <TestDataActions
                                jsonString={jsonString}
                                fileName={dataset.slug}
                                converterHref={converterHref}
                                platform={dataset.platform}
                            />
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
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payload Size</h4>
                                <p className="text-sm font-medium text-foreground">{jsonString.length.toLocaleString()} Bytes</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Format</h4>
                                <p className="text-sm font-medium text-foreground">JSON (Multi-level Nested)</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Compatible Tools</h4>
                                <p className="text-sm font-medium text-foreground">Excel (XLSX), CSV, Pandas, Power BI</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">License</h4>
                                <p className="text-sm font-medium text-foreground">Public Domain / MIT (Free for Testing)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Injected Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(datasetSchema),
                }}
            />
        </div>
    );
}
