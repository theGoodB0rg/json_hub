'use client';

import { FileJson, Users, Shield } from 'lucide-react';

const stats = [
    {
        icon: FileJson,
        value: "10,000+",
        label: "Files Converted"
    },
    {
        icon: Users,
        value: "500+",
        label: "Business Analysts"
    },
    {
        icon: Shield,
        value: "100%",
        label: "Private & Secure"
    }
];

export function UsageStats() {
    return (
        <section className="py-8 border-y border-border/40 bg-background">
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <stat.icon className="w-5 h-5 text-primary" />
                                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
