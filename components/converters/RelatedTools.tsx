
import { converterPages, ConverterPageConfig } from "@/lib/platform-data";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PlatformIcon } from '@/components/converters/PlatformIcon';

interface Props {
    currentSlug: string;
}

export function RelatedTools({ currentSlug }: Props) {
    // Show up to 6 other tools, excluding current
    const related = converterPages
        .filter(p => p.slug !== currentSlug)
        .slice(0, 6);

    return (
        <section className="mb-16 pt-8 border-t">
            <h3 className="text-2xl font-bold mb-6">More Converters</h3>
            <div className="grid md:grid-cols-3 gap-6">
                {related.map((tool) => (
                    <Link key={tool.slug} href={`/converters/${tool.slug}`} className="block group">
                        <Card className="p-4 h-full hover:border-primary/50 transition-colors flex items-center gap-4">
                            <PlatformIcon platform={tool.platformName} className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div>
                                <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                    {tool.platformName} to Excel
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-1">
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
