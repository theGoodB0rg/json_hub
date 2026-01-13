import { ConverterApp } from "@/components/ConverterApp";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JSON to CSV Converter | Free Online Tool',
    description: 'Convert nested JSON to CSV instantly. Handles large files, arrays, and complex data structures. Free, secure, and client-side.',
    alternates: {
        canonical: 'https://jsonexport.com/json-to-csv',
    }
};

export default function JsonToCsvPage() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        Convert <span className="text-primary">JSON to CSV</span> <br />
                        Online & Free.
                    </h1>
                }
                subheading="Transform complex JSON data into clean CSV files for Excel, Google Sheets, or Databases."
            />
            {/* Hidden SEO Text */}
            <section className="container mx-auto px-4 py-8 text-muted-foreground text-sm space-y-4">
                <h2 className="text-base font-bold text-foreground">Why use our JSON to CSV Converter?</h2>
                <p>
                    Converting <strong>JSON to CSV</strong> is essential for data analysis. Our tool flattens nested objects intelligently,
                    so you don&apos;t lose data. It&apos;s the best way to import API responses into spreadsheets.
                </p>
            </section>
        </>
    );
}
