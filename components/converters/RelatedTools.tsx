
import { converterPages, ConverterPageConfig } from "@/lib/platform-data";
import Link from "next/link";
import { Card } from "@/components/ui/card";

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
                        <Card className="p-4 h-full hover:border-primary/50 transition-colors">
                            <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                                {tool.platformName} to Excel
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {tool.description}
                            </p>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
