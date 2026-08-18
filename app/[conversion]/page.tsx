import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { conversionMatrix, getMatrixItem } from '@/lib/content-matrix/matrix';
import { ConverterApp } from '@/components/ConverterApp';
import { FAQSchema } from '@/components/FAQSchema';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildPageMetadata } from '@/lib/seo';
import { SITE_ORIGIN, toAbsoluteUrl } from '@/lib/routes';
import { CheckCircle2, Shield, Zap, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
    params: {
        conversion: string;
    };
}

export async function generateStaticParams() {
    return conversionMatrix.map((item) => ({
        conversion: item.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const item = getMatrixItem(params.conversion);
    if (!item) return {};

    return buildPageMetadata({
        title: item.title,
        description: item.description,
        canonicalPath: `/${item.slug}`,
    });
}

export default function ConversionPage({ params }: Props) {
    const item = getMatrixItem(params.conversion);
    if (!item) {
        notFound();
    }

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: item.h1, href: `/${item.slug}`, active: true },
    ];

    const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: item.title,
        operatingSystem: 'Any',
        applicationCategory: 'UtilitiesApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: item.content.features.join(', '),
    };

    const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to convert ${item.platformName} ${item.sourceFormat.toUpperCase()} to ${item.targetFormat.toUpperCase()}`,
        step: [
            {
                '@type': 'HowToStep',
                name: 'Provide input data',
                text: item.howTo.step1,
            },
            {
                '@type': 'HowToStep',
                name: 'Inspect and preview',
                text: item.howTo.step2,
            },
            {
                '@type': 'HowToStep',
                name: 'Download result',
                text: item.howTo.step3,
            },
        ],
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
                name: item.h1,
                item: toAbsoluteUrl(`/${item.slug}`),
            },
        ],
    };

    return (
        <>
            <div className="container mx-auto px-4 max-w-5xl pt-4">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            <ConverterApp
                pluginId={item.pluginId}
                initialSample={item.sampleData}
                heading={
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${item.accentColor} border border-primary/20 text-primary`}>
                            <Sparkles className="w-3.5 h-3.5" />
                            {item.badgeText}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                            {item.h1}
                        </h1>
                    </div>
                }
                subheading={item.subheading}
                platform={item.platformName.toLowerCase()}
            />

            {/* Programmatic Differentiated Content */}
            <div className="container mx-auto px-4 py-16 max-w-5xl space-y-16">
                {/* Intro & Value Proposition */}
                <section className="p-8 rounded-2xl bg-card border border-border/40 space-y-4">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Why Choose JsonExport for {item.platformName} Data</h2>
                    <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                        {item.content.intro}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {item.content.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/30">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-sm font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3-Step How-To Guide */}
                <section className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">
                        How to Convert in 3 Simple Steps
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-xl border border-border/40 bg-card/60 space-y-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">1</div>
                            <h3 className="font-semibold text-lg">Input Data</h3>
                            <p className="text-sm text-muted-foreground">{item.howTo.step1}</p>
                        </div>
                        <div className="p-6 rounded-xl border border-border/40 bg-card/60 space-y-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">2</div>
                            <h3 className="font-semibold text-lg">Instant Processing</h3>
                            <p className="text-sm text-muted-foreground">{item.howTo.step2}</p>
                        </div>
                        <div className="p-6 rounded-xl border border-border/40 bg-card/60 space-y-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">3</div>
                            <h3 className="font-semibold text-lg">Export &amp; Share</h3>
                            <p className="text-sm text-muted-foreground">{item.howTo.step3}</p>
                        </div>
                    </div>
                </section>

                {/* Trust & Security Callout */}
                <section className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">100% Client-Side Privacy</h3>
                            <p className="text-sm text-muted-foreground">Your files and data are parsed directly in your browser memory. Nothing is ever sent to our servers.</p>
                        </div>
                    </div>
                    <Link href="/privacy-security" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
                        Learn about our security <ArrowRight className="w-4 h-4" />
                    </Link>
                </section>

                {/* FAQ Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.faqs.map((faq, index) => (
                            <div key={index} className="p-5 rounded-xl border border-border/40 bg-card space-y-2">
                                <h3 className="font-semibold text-base text-foreground">{faq.question}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Related Tools Links */}
                <section className="space-y-4 pt-8 border-t border-border/40">
                    <h3 className="text-xl font-bold">Related Conversion Tools</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {conversionMatrix.filter((c) => c.slug !== item.slug).map((c) => (
                            <Link
                                key={c.slug}
                                href={`/${c.slug}`}
                                className="p-3 rounded-lg border border-border/40 hover:border-primary/50 text-sm font-medium hover:text-primary transition-colors bg-card/40"
                            >
                                {c.h1}
                            </Link>
                        ))}
                    </div>
                </section>
            </div>

            {/* Injected Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([softwareSchema, howToSchema, breadcrumbSchema]),
                }}
            />
            <FAQSchema faqs={item.faqs} />
        </>
    );
}
