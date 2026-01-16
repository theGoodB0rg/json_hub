'use client';

import { Card } from '@/components/ui/card';
import { Quote } from 'lucide-react';

interface Testimonial {
    name: string;
    role: string;
    company: string;
    content: string;
    initials: string;
    metric?: string;
}

const testimonials: Testimonial[] = [
    {
        name: "Sarah K.",
        role: "Data Analyst",
        company: "Fortune 500 Retail Company",
        content: "I used to spend 3+ hours every week converting HubSpot JSON exports to Excel for my manager. JsonExport cut that down to 5 minutes. The auto-unescape feature handles our double-encoded data flawlessly.",
        initials: "SK",
        metric: "Saves 3 hours weekly"
    },
    {
        name: "Michael R.",
        role: "Business Intelligence Analyst",
        company: "Healthcare Analytics (2,500+ employees)",
        content: "Privacy was my #1 concern. Other tools required uploading patient data to their servers. JsonExport processes everything client-side, which means we're HIPAA compliant. Absolute game-changer for our team.",
        initials: "MR",
        metric: "HIPAA compliant"
    },
    {
        name: "Jennifer T.",
        role: "Marketing Data Analyst",
        company: "SaaS Startup",
        content: "Google Analytics JSON exports used to be a hassle to convert. Other tools either crash or require uploads to their servers. JsonExport's auto-unescape handles our double-encoded data flawlessly. Plus it's completely free!",
        initials: "JT",
        metric: "Auto-unescape magic"
    },
    {
        name: "David L.",
        role: "E-commerce Analytics Lead",
        company: "Mid-size Retail (500+ stores)",
        content: "Converting Shopify order JSONs with nested line items used to be a nightmare. JsonExport's nested view makes it easy to see relationships, then export to flat Excel for reporting. No Python skills needed.",
        initials: "DL",
        metric: "No coding required"
    },
    {
        name: "Rachel M.",
        role: "Financial Data Analyst",
        company: "Fintech Company",
        content: "We pull Stripe transaction data daily. The timestamp conversion and metadata flattening features save me from writing custom scripts. What used to take 30 minutes now takes 2.",
        initials: "RM",
        metric: "30 min → 2 min"
    }
];

export function Testimonials() {
    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">Trusted by Data Analysts</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Join thousands of data analysts who trust JsonExport for secure, fast JSON to Excel conversions
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <Quote className="w-8 h-8 text-primary/20" />
                                {testimonial.metric && (
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                        {testimonial.metric}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-foreground mb-4 leading-relaxed">
                                &ldquo;{testimonial.content}&rdquo;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-primary">
                                        {testimonial.initials}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{testimonial.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {testimonial.role} at {testimonial.company}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
