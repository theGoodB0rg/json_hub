import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { converterPages } from '@/lib/platform-data';
import { ConverterApp } from '@/components/ConverterApp';
import { FAQSchema } from '@/components/FAQSchema';
import { IntroSection } from '@/components/converters/IntroSection';
import { FeaturesGrid } from '@/components/converters/FeaturesGrid';
import { FAQSection } from '@/components/converters/FAQSection';
import { DemoPreview } from '@/components/converters/DemoPreview';
import { RelatedTools } from '@/components/converters/RelatedTools';
import { PlatformIcon } from '@/components/converters/PlatformIcon';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { generateSoftwareApplicationSchema, generateHowToSchema, generateBreadcrumbSchema } from '@/lib/schema-generator';

interface Props {
    params: {
        slug: string;
    };
}

export async function generateStaticParams() {
    return converterPages.map((page) => ({
        slug: page.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const pageConfig = converterPages.find((p) => p.slug === params.slug);

    if (!pageConfig) {
        return {};
    }

    return {
        title: pageConfig.title,
        description: pageConfig.description,
        alternates: {
            canonical: `https://jsonexport.com/converters/${pageConfig.slug}`,
        }
    };
}

export default function ConverterPage({ params }: Props) {
    const pageConfig = converterPages.find((p) => p.slug === params.slug);

    if (!pageConfig) {
        notFound();
    }

    const softwareSchema = generateSoftwareApplicationSchema(pageConfig);
    const howToSchema = generateHowToSchema(pageConfig);
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: "Converters", item: "/#converters" }, // Anchor to home converters section or could be a dedicated page
        { name: `${pageConfig.platformName} to Excel`, item: `/converters/${pageConfig.slug}` }
    ]);

    const breadcrumbItems = [
        { label: "Converters", href: "/#converters" },
        { label: `${pageConfig.platformName} to Excel`, href: `/converters/${pageConfig.slug}`, active: true }
    ];

    return (
        <>
            <div className="container mx-auto px-4 max-w-5xl">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            <ConverterApp
                heading={
                    <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <PlatformIcon platform={pageConfig.platformName} className="w-16 h-16 md:w-20 md:h-20" />
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground text-center">
                            {pageConfig.h1}
                        </h1>
                    </div>
                }
                subheading={pageConfig.subheading}
                platform={pageConfig.platformName.toLowerCase()}
            />

            {/* Content for SEO ranking */}
            <div className="container mx-auto px-4 py-16 max-w-5xl">

                <IntroSection pageConfig={pageConfig} />

                <FeaturesGrid pageConfig={pageConfig} />

                <DemoPreview pageConfig={pageConfig} />

                <FAQSection pageConfig={pageConfig} />

                {/* Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify([softwareSchema, howToSchema, breadcrumbSchema])
                    }}
                />

                {/* FAQ Schema for rich snippets */}
                <FAQSchema faqs={pageConfig.faqs} />

                {/* Contextual SEO Internal Link */}
                {pageConfig.slug.includes('shopify') && (
                    <div className="my-12 p-6 md:p-8 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold">Recommended Operational Guide</h3>
                            <p className="text-muted-foreground mt-1 max-w-xl">Why Shopify Line Items Break in Excel exports, and the fastest way to flatten them for reporting.</p>
                        </div>
                        <Link
                            href="/blog/shopify-line-items-excel-export-fix"
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                        >
                            Read Guide &rarr;
                        </Link>
                    </div>
                )}

                <RelatedTools currentSlug={pageConfig.slug} />
            </div>
        </>
    );
}
