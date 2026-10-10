import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LinkTarget } from '@/lib/internal-links';

const KIND_LABEL: Record<LinkTarget['kind'], string> = {
    blog: 'Guide',
    converter: 'Converter',
    dataset: 'Sample data',
    tool: 'Tool',
};

interface RelatedLinksProps {
    links: LinkTarget[];
    heading?: string;
    /** Short line explaining the grouping; helps the section read as content. */
    intro?: string;
}

/**
 * Onward links at the foot of a content page.
 *
 * These are rendered server-side into the static HTML on purpose. The pages
 * carrying this section are the ones Google already crawls, and they were
 * previously dead ends — which is a large part of why 32 URLs sat at
 * "Discovered - currently not indexed" with lastCrawlTime: NEVER.
 */
export function RelatedLinks({ links, heading = 'Related', intro }: RelatedLinksProps) {
    if (links.length === 0) return null;

    return (
        <section
            aria-labelledby="related-links-heading"
            className="border-t border-border/60 bg-muted/20"
        >
            <div className="container mx-auto max-w-5xl px-4 py-12">
                <h2 id="related-links-heading" className="text-2xl font-bold tracking-tight">
                    {heading}
                </h2>
                {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}

                <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {links.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className="group flex h-full flex-col rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
                            >
                                <span className="text-xs font-medium uppercase tracking-wide text-primary/80">
                                    {KIND_LABEL[link.kind]}
                                </span>
                                <span className="mt-2 font-semibold leading-snug text-foreground">
                                    {link.title}
                                </span>
                                {link.description && (
                                    <span className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                        {link.description}
                                    </span>
                                )}
                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                                    Open
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default RelatedLinks;
