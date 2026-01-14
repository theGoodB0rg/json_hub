import { ConverterApp } from "@/components/ConverterApp";
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
            <section className="container mx-auto px-4 py-8 text-muted-foreground text-sm space-y-4">
                <h2 className="text-base font-bold text-foreground">Best Free JSON Converter for Developers and Data Analysts</h2>
                <p>
                    JsonExport is the ultimate tool to <strong>convert JSON to Excel</strong>, <strong>JSON to CSV</strong>, and other formats instantly.
                    Unlike other tools, we calculate everything in your browser, ensuring your data never leaves your device.
                    Perfect for converting complex, nested JSON objects into flat, readable spreadsheets.
                </p>
                <p>
                    Whether you need to <a href="/json-to-csv" className="underline hover:text-primary">convert JSON to CSV</a> for database imports or <a href="/json-to-excel" className="underline hover:text-primary">transform JSON to Excel</a> for reporting, JsonExport handles
                    large files, arrays, and deep nesting with ease.
                </p>
            </section>
        </>
    );
}
