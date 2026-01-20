import { ConverterApp } from "@/components/ConverterApp";
import { ComparisonTable } from "@/components/ComparisonTable";
import { converterPages } from "@/lib/converters";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JsonExport | Free JSON to Excel Converter for Data Analysts (No Coding Required)',
    description: 'Convert JSON to Excel instantly. 100% private (no upload), handles files up to 100MB, completely free forever. Ideal for data analysts who need quick, secure conversions without coding.',
    alternates: {
        canonical: 'https://jsonexport.com',
    }
};

export default function Home() {
    return (
        <>
            <ConverterApp />

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
