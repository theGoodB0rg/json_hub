import { ConverterApp } from "@/components/ConverterApp";
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = buildPageMetadata({
    title: 'JSON to CSV Converter Online — Auto-Flatten Nested Data (Free)',
    description: 'Convert JSON to CSV files instantly in 1 click. Automatically unwinds nested arrays and hierarchical objects into clean columns for Excel and databases.',
    canonicalPath: ROUTES.jsonToCsv,
});

export default function JsonToCsvPage() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        Convert <span className="text-primary">JSON to CSV</span> <br />
                        <span className="text-3xl md:text-5xl text-muted-foreground">Online — Fast &amp; Auto-Flattened.</span>
                    </h1>
                }
                subheading="The fastest way to convert JSON data into clean CSV files for Excel, Google Sheets, or database imports. Handles nested objects and arrays automatically."
            />
            {/* Hidden SEO Text */}
            <section className="container mx-auto px-4 py-8 text-muted-foreground text-sm space-y-4">
                <h2 className="text-base font-bold text-foreground">Why Choose JsonExport for JSON to CSV Conversion?</h2>
                <p>
                    Converting <strong>JSON to CSV</strong> is essential for data analysis. Our tool flattens nested objects intelligently,
                    so you don&apos;t lose data. It&apos;s the best way to import API responses into spreadsheets.
                </p>
            </section>
        </>
    );
}
