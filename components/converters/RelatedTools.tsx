import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { getRelatedConverters } from '@/lib/converters/catalog';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface Props {
    currentSlug: string;
}

export function RelatedTools({ currentSlug }: Props) {
    const related = getRelatedConverters(currentSlug, 6);

    return (
        <section className="mb-16 pt-10 border-t border-border/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Related Data Converters</h3>
                    <p className="text-sm text-muted-foreground">More format and platform converters matching your workflow</p>
                </div>
                <Link
                    href={ROUTES.converters}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                >
                    View all 35+ converters &rarr;
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {related.map((tool) => (
                    <Link key={tool.slug} href={tool.href} className="block group">
                        <Card className="p-4 h-full border border-border/40 hover:border-primary/50 transition-all hover:shadow-sm flex items-start gap-3 bg-card/80">
                            <BrandIcon
                                platform={tool.platformName}
                                format={!tool.isPlatformIntegration ? tool.sourceFormat : undefined}
                                className="w-8 h-8 shrink-0 mt-0.5"
                            />
                            <div className="space-y-1 min-w-0 flex-1">
                                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                    {tool.shortTitle}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {tool.description}
                                </p>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
