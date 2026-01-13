import { ConverterApp } from "@/components/ConverterApp";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JSON to Excel Converter (XLSX) | Free Online Tool',
    description: 'Convert JSON to Excel (XLSX) instantly. Preserves data types, handles nested arrays, and provides a downloadable spreadsheet. 100% Secure.',
    alternates: {
        canonical: 'https://jsonexport.com/json-to-excel',
    }
};

export default function JsonToExcelPage() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        Convert <span className="text-green-600 dark:text-green-500">JSON to Excel</span> <br />
                        Spreadsheets (XLSX).
                    </h1>
                }
                subheading="The most reliable way to turn JSON data into formatted Excel files. Supports nested data flattening."
            />
            {/* Hidden SEO Text */}
            <section className="container mx-auto px-4 py-8 text-muted-foreground text-sm space-y-4">
                <h2 className="text-base font-bold text-foreground">Reliable JSON to Excel Conversion</h2>
                <p>
                    Need to view JSON data in Microsoft Excel? Our <strong>JSON to Excel converter</strong> generates native .xlsx files, not just text.
                    It automatically handles column headers and data types for a seamless experience.
                </p>
            </section>
        </>
    );
}
