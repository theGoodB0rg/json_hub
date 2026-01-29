import { ConverterApp } from "@/components/ConverterApp";
import { ComparisonTable } from "@/components/ComparisonTable";
import { converterPages } from '@/lib/platform-data';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JsonExport | Free JSON to Excel Converter for Data Analysts (No Coding Required)',
    description: 'Convert JSON to Excel instantly. 100% private (no upload), handles files up to 100MB, free to use with no signup. Ideal for data analysts who need quick, secure conversions without coding.',
    alternates: {
        canonical: 'https://jsonexport.com',
    }
};

export default function Home() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        Convert JSON to Excel <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                            Without Uploading Data.
                        </span>
                    </h1>
                }
                subheading="The privacy-first converter for data analysts. Process 100MB+ files from Salesforce, Stripe, or APIs directly in your browser. Zero latency. Zero data risk."
            />

            {/* Comparison Table Section */}
            <section className="container mx-auto px-4 py-12 border-t border-border/40">
                <h2 className="text-2xl font-bold mb-2">How JsonExport Compares to Alternatives</h2>
                <p className="text-muted-foreground mb-6">
                    See why data analysts choose JsonExport over Power Query, Python, and other converters
                </p>
                <ComparisonTable />
            </section>

            {/* Popular Converters Links - SEO Hub */}
            <section className="container mx-auto px-4 py-12 border-t border-border/40">
                <h2 className="text-2xl font-bold mb-6">Popular Conversions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {converterPages.map((page) => (
                        <a
                            key={page.slug}
                            href={`/converters/${page.slug}`}
                            className="group block p-4 rounded-lg border border-border/40 bg-card hover:border-primary/50 hover:bg-muted/30 transition-all"
                        >
                            <h3 className="font-semibold text-primary group-hover:underline mb-2">{page.h1}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {page.description}
                            </p>
                        </a>
                    ))}
                </div>
            </section>
        </>
    );
}
