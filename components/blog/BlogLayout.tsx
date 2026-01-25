'use client';

import { TableOfContents } from './TableOfContents';

interface BlogLayoutProps {
    children: React.ReactNode;
    toc?: { id: string; title: string; level: number }[];
    meta: {
        title: string;
        description: string;
        date: string;
        author: {
            name: string;
            role: string;
            image?: string;
        };
        readTime: string;
    };
}

export function BlogLayout({ children, toc, meta }: BlogLayoutProps) {
    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Main Content Column */}
                <main className="lg:col-span-9">
                    {/* Header */}
                    <div className="mb-12 border-b pb-8">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">Guide</span>
                            <span>•</span>
                            <span>{meta.readTime}</span>
                            <span>•</span>
                            <span>Updated {meta.date}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-balance">
                            {meta.title}
                        </h1>
                        <p className="text-xl text-muted-foreground w-full max-w-3xl leading-relaxed">
                            {meta.description}
                        </p>
                    </div>

                    {/* Article Body */}
                    <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-a:text-primary hover:prose-a:underline prose-img:rounded-xl">
                        {children}
                    </article>

                    {/* Author Footer */}
                    <div className="mt-16 pt-8 border-t flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-xl font-bold text-primary">
                            {meta.author.name[0]}
                        </div>
                        <div>
                            <div className="font-bold">{meta.author.name}</div>
                            <div className="text-sm text-muted-foreground">{meta.author.role}</div>
                        </div>
                    </div>
                </main>

                {/* Sidebar (Tablet/Desktop only) */}
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-24">
                        {toc && <TableOfContents items={toc} />}

                        {/* Example of "Sticky CTA" */}
                        <div className="mt-8 bg-muted/50 rounded-lg p-4 border text-sm">
                            <h5 className="font-bold mb-2">Need a quick fix?</h5>
                            <p className="text-muted-foreground mb-4">Don&apos;t want to read? Use the tool instantly.</p>
                            <a href="/#converter" className="block w-full text-center bg-primary text-primary-foreground py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors">
                                Go to Converter
                            </a>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
