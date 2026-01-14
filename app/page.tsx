import { ConverterApp } from "@/components/ConverterApp";
import { converterPages } from "@/lib/converters";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JsonExport | Free Data Analyst Workbench (JSON to CSV/Excel)',
    alternates: {
        canonical: 'https://jsonexport.com',
    }
};

export default function Home() {
    return (
        <>
            <ConverterApp />

            {/* Hidden SEO Text for crawlers (visible if desired, but kept low profile) */}
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
