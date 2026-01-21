
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { converterPages } from '@/lib/platform-data';
import { ConverterApp } from '@/components/ConverterApp';
import { FAQSchema } from '@/components/FAQSchema';
import { IntroSection } from '@/components/converters/IntroSection';
import { FeaturesGrid } from '@/components/converters/FeaturesGrid';
import { FAQSection } from '@/components/converters/FAQSection';
import { DemoPreview } from '@/components/converters/DemoPreview';
import { RelatedTools } from '@/components/converters/RelatedTools';
import { PlatformIcon } from '@/components/converters/PlatformIcon';
import { generateSoftwareApplicationSchema, generateHowToSchema } from '@/lib/schema-generator';

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
            canonical: `/converters/${pageConfig.slug}`,
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

    return (
        <>
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
                        __html: JSON.stringify([softwareSchema, howToSchema])
                    }}
                />

                {/* FAQ Schema for rich snippets */}
                <FAQSchema faqs={pageConfig.faqs} />

                <RelatedTools currentSlug={pageConfig.slug} />
            </div>
        </>
    );
}
