'use client';

import { Card } from '@/components/ui/card';
import { Quote } from 'lucide-react';

interface Testimonial {
    name: string;
    role: string;
    company: string;
    content: string;
    initials: string;
}

const testimonials: Testimonial[] = [
    {
        name: "Sarah Chen",
        role: "Business Analyst",
        company: "TechCorp",
        content: "JSON Hub saved me hours every week. The auto-unescape feature is a lifesaver for our messy API data.",
        initials: "SC"
    },
    {
        name: "Michael Rodriguez",
        role: "Data Analyst",
        company: "FinanceHub",
        content: "Finally, a JSON converter that respects privacy. No more uploading sensitive financial data to random sites.",
        initials: "MR"
    },
    {
        name: "Emily Watson",
        role: "Product Manager",
        company: "StartupXYZ",
        content: "The nested-to-flat conversion is brilliant. I can now share API data with my team in Excel format instantly.",
        initials: "EW"
    }
];

export function Testimonials() {
    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Trusted by Business Analysts</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Join thousands of professionals who trust JSON Hub for their data conversion needs
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                            <Quote className="w-8 h-8 text-primary/20 mb-4" />
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
