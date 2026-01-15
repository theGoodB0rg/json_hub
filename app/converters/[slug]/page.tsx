
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { converterPages } from '@/lib/converters';
import { ConverterApp } from '@/components/ConverterApp';
import { Card } from '@/components/ui/card';
import { CheckCircle2, FileJson } from 'lucide-react';
import { FAQ } from '@/components/FAQ';
import { FAQSchema } from '@/components/FAQSchema';

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

    // Merge global FAQs with specific ones if needed, or just use specific ones
    // For now, we'll let the user decide if they want to override the default FAQ component
    // or we can build a CustomFAQ component. 

    // We will render the standard ConverterApp but inject the specific content below it.

    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {pageConfig.h1}
                    </h1>
                }
                subheading={pageConfig.subheading}
            />

            {/* Content for SEO ranking */}
            <div className="container mx-auto px-4 py-16 max-w-5xl">

                {/* Intro Section */}
                <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <h2 className="text-3xl font-bold mb-6">Why use {pageConfig.h1}?</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        {pageConfig.content.intro}
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <Card className="p-8 border-primary/20 bg-primary/5">
                        <div className="flex items-start gap-4">
                            <FileJson className="w-8 h-8 text-primary flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-xl mb-2">Native Support</h3>
                                <p className="text-muted-foreground">
                                    Specifically tuned to handle the quirks and nested structures of <strong>{pageConfig.slug.split('-')[0]}</strong> JSON data.
                                </p>
                            </div>
                        </div>
                    </Card>
                    <div className="space-y-4">
                        {pageConfig.content.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-lg">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Specific FAQ Section - Overrides/Adds to the default one if we wanted, 
                    but here we will render a dedicated FAQ section for this tool for maximum SEO context */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold mb-6">Specific Questions</h3>
                    <div className="space-y-4">
                        {pageConfig.faqs.map((faq, i) => (
                            <Card key={i} className="p-6">
                                <h4 className="font-semibold text-lg mb-2">{faq.question}</h4>
                                <p className="text-muted-foreground">{faq.answer}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Schema.org for this specific tool */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": pageConfig.title,
                            "applicationCategory": "DeveloperApplication",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD"
                            },
                            "description": pageConfig.description,
                        })
                    }}
                />

                {/* FAQ Schema for rich snippets */}
                <FAQSchema faqs={pageConfig.faqs} />
            </div>
        </>
    );
}
