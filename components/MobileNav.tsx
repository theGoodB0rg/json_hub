'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Github, Star, Layers, ArrowRight, FileJson, Sparkles } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton/ShareButton';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConversionHistory } from '@/components/ConversionHistory/ConversionHistory';
import { BatchProcessor } from '@/components/BatchProcessor/BatchProcessor';
import { ProjectManager } from '@/components/ProjectManager';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { ROUTES } from '@/lib/routes';

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="lg:hidden" size="icon">
                    <Menu />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 overflow-y-auto max-h-screen">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 mb-6 px-2">
                    <div className="relative w-8 h-8">
                        <Image
                            src="/icon.svg"
                            alt="JsonExport Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="font-bold text-lg">JsonExport</span>
                </Link>

                <div className="flex flex-col gap-4 py-2 pr-4">
                    {/* Converters Directory CTA */}
                    <Button
                        asChild
                        variant="default"
                        className="w-full justify-between shadow-sm bg-primary text-primary-foreground font-semibold"
                        onClick={() => setOpen(false)}
                    >
                        <Link href={ROUTES.converters}>
                            <span className="flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                All 35+ Converters
                            </span>
                            <ArrowRight className="w-4 h-4 opacity-70" />
                        </Link>
                    </Button>

                    {/* Quick Format Shortcuts */}
                    <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                            Format Engines
                        </h4>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <Link
                                href="/"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors"
                            >
                                <BrandIcon format="json" className="w-4 h-4" />
                                <span>JSON &rarr; Excel</span>
                            </Link>
                            <Link
                                href="/json-to-csv"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors"
                            >
                                <BrandIcon format="json" className="w-4 h-4" />
                                <span>JSON &rarr; CSV</span>
                            </Link>
                            <Link
                                href="/csv-to-json"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors"
                            >
                                <BrandIcon format="csv" className="w-4 h-4" />
                                <span>CSV &rarr; JSON</span>
                            </Link>
                            <Link
                                href="/xml-to-excel"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors"
                            >
                                <BrandIcon format="xml" className="w-4 h-4" />
                                <span>XML &rarr; Excel</span>
                            </Link>
                        </div>
                    </div>

                    {/* Popular SaaS Integrations */}
                    <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                            Popular SaaS Presets
                        </h4>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <Link
                                href="/converters/stripe-json-to-excel"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors"
                            >
                                <BrandIcon platform="stripe" className="w-4 h-4" />
                                <span>Stripe</span>
                            </Link>
                            <Link
                                href="/converters/shopify-json-to-csv"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors"
                            >
                                <BrandIcon platform="shopify" className="w-4 h-4" />
                                <span>Shopify</span>
                            </Link>
                            <Link
                                href="/converters/salesforce-json-to-excel"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors"
                            >
                                <BrandIcon platform="salesforce" className="w-4 h-4" />
                                <span>Salesforce</span>
                            </Link>
                            <Link
                                href="/converters/hubspot-json-to-excel"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors"
                            >
                                <BrandIcon platform="hubspot" className="w-4 h-4" />
                                <span>HubSpot</span>
                            </Link>
                        </div>
                    </div>

                    <div className="h-px bg-border my-2" />

                    {/* Main Actions */}
                    <div className="grid gap-2">
                        <ShareButton className="w-full justify-start [&_span]:!inline" />
                        <BatchProcessor className="w-full justify-start [&_span]:!inline" />
                        <ConversionHistory className="w-full justify-start [&_span]:!inline" />
                        <Button variant="ghost" asChild className="w-full justify-start text-muted-foreground" onClick={() => setOpen(false)}>
                            <Link href="/blog">
                                <span>Blog</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" asChild className="w-full justify-start text-muted-foreground" onClick={() => setOpen(false)}>
                            <Link href="/recommended-tools">
                                <span>Recommended Tools</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" asChild className="w-full justify-start text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
                            <a
                                href="https://github.com/theGoodB0rg/json_hub"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Star className="w-4 h-4 mr-2 fill-amber-500 text-amber-500" />
                                <span>Star on GitHub</span>
                                <Github className="w-4 h-4 ml-auto text-muted-foreground" />
                            </a>
                        </Button>
                    </div>

                    <div className="h-px bg-border my-2" />

                    {/* Project Management */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Projects</h4>
                        <div className="flex flex-col gap-2 [&>div]:w-full [&_button]:flex-1">
                            <ProjectManager className="w-full justify-between [&_span]:!inline" />
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
