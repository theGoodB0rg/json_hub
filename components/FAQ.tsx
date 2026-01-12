'use client';

import { Card } from '@/components/ui/card';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "Is my data safe? Do you upload my JSON files?",
        answer: "Absolutely safe! JsonExport processes everything in your browser using JavaScript. Your data never leaves your computer - no uploads, no servers, 100% private."
    },
    {
        question: "What JSON formats are supported?",
        answer: "We support standard JSON, double-encoded JSON (escaped strings), nested objects, arrays, and even GeoJSON. Our smart parser automatically detects and handles complex structures."
    },
    {
        question: "Can I convert large JSON files?",
        answer: "Yes! JsonExport supports files up to 10MB and can handle 100,000+ rows. For very large datasets, we recommend using the flat export mode for better performance."
    },
    {
        question: "What's the difference between flat and nested export?",
        answer: "Flat mode converts nested JSON into a single table with dot notation (e.g., 'user.address.city'). Nested mode preserves hierarchy with merged cells in Excel, ideal for relational data."
    },
    {
        question: "Do I need to install anything?",
        answer: "No installation needed! JsonExport is a web application that runs entirely in your browser. Just visit the site and start converting. You can also install it as a PWA for offline use."
    },
    {
        question: "Can I edit the data before exporting?",
        answer: "Yes! Double-click any cell in the data grid to edit values. Changes are reflected in your export. This is perfect for quick data cleanup before downloading."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <HelpCircle className="w-6 h-6 text-primary" />
                        <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
                    </div>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to know about converting JSON to Excel
                    </p>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => (
                        <Card
                            key={index}
                            className="overflow-hidden transition-all hover:shadow-md"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full p-6 text-left flex items-start justify-between gap-4 hover:bg-accent/50 transition-colors"
                            >
                                <span className="font-semibold text-foreground pr-4">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-6 text-muted-foreground leading-relaxed animate-in slide-in-from-top-2 duration-200">
                                    {faq.answer}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                {/* FAQ Schema for SEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            "mainEntity": faqs.map(faq => ({
                                "@type": "Question",
                                "name": faq.question,
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": faq.answer
                                }
                            }))
                        })
                    }}
                />
            </div>
        </section>
    );
}
