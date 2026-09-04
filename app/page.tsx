import { ConverterApp } from "@/components/ConverterApp";
import { ComparisonTable } from "@/components/ComparisonTable";
import { converterPages } from '@/lib/platform-data';
import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES, converterPath } from '@/lib/routes';
import { BrandIcon } from '@/components/ui/BrandIcon';

export const metadata: Metadata = buildPageMetadata({
    title: 'JSON to Excel (XLSX) Converter — Free, Instant & No Sign-up',
    description: 'Convert JSON to Excel (.xlsx) or CSV in 1 click. Auto-flattens nested arrays, fixes [object Object] errors, and processes 100MB+ files with zero sign-up.',
    canonicalPath: ROUTES.home,
});

export default function Home() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        Convert <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">JSON to Excel</span> Instantly.
                    </h1>
                }
                subheading="The fast online JSON exporter — auto-flattens nested arrays, fixes [object Object] errors, and unwinds API dumps from Stripe, Salesforce, HubSpot into clean spreadsheets."
            />

            {/* Comparison Table Section */}
            <section className="container mx-auto px-4 py-12 border-t border-border/40">
                <h2 className="text-2xl font-bold mb-2">How JsonExport Compares to Alternatives</h2>
                <p className="text-muted-foreground mb-6">
                    See why data analysts choose JsonExport over Power Query, Python, and online converters
                </p>
                <ComparisonTable />
            </section>

            {/* Popular Converters Links - SEO Hub */}
            <section className="container mx-auto px-4 py-12 border-t border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Popular Converters &amp; Presets</h2>
                        <p className="text-muted-foreground text-sm">Instant, zero-upload data converters for top SaaS tools and file formats</p>
                    </div>
                    <Link
                        href={ROUTES.converters}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                        Browse all 35+ converters &rarr;
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {converterPages.slice(0, 9).map((page) => (
                        <Link
                            key={page.slug}
                            href={converterPath(page.slug)}
                            className="group block p-4 rounded-xl border border-border/40 bg-card hover:border-primary/50 hover:bg-muted/30 transition-all hover:shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <BrandIcon platform={page.platformName} className="w-8 h-8 shrink-0 mt-0.5" />
                                <div className="space-y-1 min-w-0">
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm truncate">
                                        {page.h1}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {page.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="mt-8 text-center">
                    <Link
                        href={ROUTES.converters}
                        className="inline-flex items-center justify-center rounded-lg bg-secondary/80 hover:bg-secondary text-secondary-foreground px-6 py-2.5 text-sm font-medium transition-colors border border-border/50 shadow-sm"
                    >
                        Explore all 35+ formats &amp; platform integrations &rarr;
                    </Link>
                </div>
            </section>

            {/* Recommended Tools - Internal Link Hub */}
            <section className="container mx-auto px-4 py-12 border-t border-border/40">
                <h2 className="text-2xl font-bold mb-2">Recommended Tools</h2>
                <p className="text-muted-foreground mb-6 max-w-3xl">
                    A short list of tools we recommend alongside JsonExport for JSON workflows, API debugging, and preventing lost work.
                </p>
                <Link
                    href={ROUTES.recommendedTools}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    View recommended tools
                </Link>
            </section>
        </>
    );
}
