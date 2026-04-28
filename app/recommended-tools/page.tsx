import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { buildPageMetadata } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';

const tools = [
    {
        name: 'Universal Undo',
        url: 'https://universalundo.app/',
        tagline: 'Recover deleted text on Android (a “Ctrl+Z” safety net).',
        why: 'If you ever lose a draft after an accidental delete, Universal Undo can help you restore what you typed across many apps using Android Accessibility events.',
    },
    {
        name: 'Postman',
        url: 'https://www.postman.com/',
        tagline: 'API testing + collections for repeatable workflows.',
        why: 'Great for saving example JSON responses you can paste into JsonExport when building reports or debugging API payloads.',
    },
    {
        name: 'JSON Crack',
        url: 'https://jsoncrack.com/',
        tagline: 'Visualize JSON as an interactive graph.',
        why: 'Handy when you need a quick mental model before flattening/exporting.',
    },
    {
        name: 'regex101',
        url: 'https://regex101.com/',
        tagline: 'Regex tester with explanations.',
        why: 'Useful for cleaning/transforming fields before export (IDs, dates, nested keys).',
    },
] as const;

export const metadata: Metadata = {
    ...buildPageMetadata({
        title: 'Recommended Tools for Data Analysts (2026) | JsonExport',
        description: 'A short, practical list of tools we use alongside JsonExport: recover deleted text on Android, debug APIs, visualize JSON, and clean data fast.',
        canonicalPath: ROUTES.recommendedTools,
    }),
    keywords: ['data analyst tools', 'developer tools', 'json tools', 'api testing tools', 'recover deleted text android'],
};

export default function RecommendedToolsPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-5xl">
            <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    Recommended Tools
                </h1>
                <p className="mt-3 text-muted-foreground text-lg max-w-3xl">
                    Tools we genuinely recommend for data analysts and developers working with JSON, exports, and day-to-day workflow reliability.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                    Tip: looking for guides? Browse the{' '}
                    <Link href={ROUTES.blog} className="underline underline-offset-4 hover:text-primary">
                        JsonExport blog
                    </Link>
                    .
                </p>
            </div>

            <div className="grid gap-6">
                {tools.map((tool) => (
                    <Card key={tool.url} className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold">{tool.name}</h2>
                                <p className="text-muted-foreground">{tool.tagline}</p>
                                <p className="text-sm text-muted-foreground">{tool.why}</p>
                            </div>
                            <div className="shrink-0">
                                <a
                                    href={tool.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    Visit
                                </a>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-10 text-xs text-muted-foreground">
                <p>
                    Disclosure: We may update this page over time based on real usage and reader feedback.
                </p>
            </div>
        </div>
    );
}
