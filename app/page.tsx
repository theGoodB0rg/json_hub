import { ConverterApp } from "@/components/ConverterApp";
import { ComparisonTable } from "@/components/ComparisonTable";
import { converterPages } from '@/lib/platform-data';
import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES, converterPath } from '@/lib/routes';

export const metadata: Metadata = buildPageMetadata({
    title: 'JsonExport | CRM & API JSON Export Repair Tool',
    description: 'Fix broken Salesforce, Stripe, and HubSpot JSON exports. Convert nested JSON to clean Excel instantly. 100% private (no upload), handles files up to 100MB.',
    canonicalPath: ROUTES.home,
});

export default function Home() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        CRM or API export showing <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                            `[object Object]` in Excel?
                        </span>
                    </h1>
                }
                subheading="Fix it instantly. The privacy-first export repair tool. Convert messy, nested JSON from Salesforce, Stripe, HubSpot, or any API into clean Excel sheets. Zero latency. Zero data risk."
            />

            {/* Comparison Table Section */}
            <section className="container mx-auto px-4 py-12 border-t border-border/40">
                <h2 className="text-2xl font-bold mb-2">How JsonExport Compares to Alternatives</h2>
                <p className="text-muted-foreground mb-6">
                    See why Ops teams and Admins choose JsonExport over Power Query, Python, and other converters
                </p>
                <ComparisonTable />
            </section>

            {/* Popular Converters Links - SEO Hub */}
            <section className="container mx-auto px-4 py-12 border-t border-border/40">
                <h2 className="text-2xl font-bold mb-6">Popular Conversions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {converterPages.map((page) => (
                        <Link
                            key={page.slug}
                            href={converterPath(page.slug)}
                            className="group block p-4 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-muted/30 transition-all"
                        >
                            <h3 className="font-semibold text-primary group-hover:underline mb-2">{page.h1}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {page.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>
        </>
    );
}
