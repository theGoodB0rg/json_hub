import { Metadata } from 'next';
import { ConverterDirectory } from '@/components/converters/ConverterDirectory';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES, SITE_ORIGIN, toAbsoluteUrl } from '@/lib/routes';
import { CONVERTER_CATALOG } from '@/lib/converters/catalog';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = buildPageMetadata({
    title: 'All Data Converters & Formats Directory — JSON, CSV, XML, Excel | JsonExport',
    description: 'Explore 35+ free, 100% private data converters for Stripe, Salesforce, HubSpot, Shopify, Jira, and core formats (CSV, XML, JSON, Excel). No server uploads.',
    canonicalPath: ROUTES.converters,
});

export default function ConvertersDirectoryPage() {
    const breadcrumbItems = [
        { label: 'Home', href: ROUTES.home },
        { label: 'All Converters & Formats', href: ROUTES.converters, active: true },
    ];

    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'JsonExport Data Converters & Formats Directory',
        description: 'Directory of 35+ free client-side converters for CRM exports, API JSON dumps, CSV spreadsheets, and XML catalogs.',
        url: toAbsoluteUrl(ROUTES.converters),
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: CONVERTER_CATALOG.length,
            itemListElement: CONVERTER_CATALOG.slice(0, 30).map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.title,
                url: toAbsoluteUrl(item.href),
            })),
        },
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: SITE_ORIGIN,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Converters Directory',
                item: toAbsoluteUrl(ROUTES.converters),
            },
        ],
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header Breadcrumbs */}
            <div className="container mx-auto px-4 max-w-6xl pt-6">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            {/* Directory Hero */}
            <header className="container mx-auto px-4 max-w-6xl pt-8 pb-12 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Universal Data Transformation Hub</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                    Data Converters &amp; Platform Presets
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Convert, flatten, and export data between JSON, CSV, XML, and Excel formats. 100% private, client-side execution in your browser.
                </p>
            </header>

            {/* Main Interactive Directory */}
            <main className="container mx-auto px-4 max-w-6xl">
                <ConverterDirectory />
            </main>

            {/* Structured Schema Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([collectionSchema, breadcrumbSchema]),
                }}
            />
        </div>
    );
}
