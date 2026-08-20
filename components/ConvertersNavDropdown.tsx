'use client';

import React from 'react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { ChevronDown, Layers, ArrowRight, Sparkles } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

export function ConvertersNavDropdown() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors h-8 px-2.5"
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Converters</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-2 shadow-xl border-border/60">
                <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Format Engines</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">100% Client-Side</span>
                </div>
                <div className="grid grid-cols-2 gap-1 py-1">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon format="json" className="w-4 h-4" />
                            <span className="font-medium">JSON &rarr; Excel</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/json-to-csv" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon format="json" className="w-4 h-4" />
                            <span className="font-medium">JSON &rarr; CSV</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/csv-to-json" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon format="csv" className="w-4 h-4" />
                            <span className="font-medium">CSV &rarr; JSON</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/xml-to-excel" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon format="xml" className="w-4 h-4" />
                            <span className="font-medium">XML &rarr; Excel</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/xml-to-json" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon format="xml" className="w-4 h-4" />
                            <span className="font-medium">XML &rarr; JSON</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/csv-to-excel" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon format="csv" className="w-4 h-4" />
                            <span className="font-medium">CSV &rarr; Excel</span>
                        </Link>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-1.5" />

                <div className="px-2 py-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Top SaaS Presets</span>
                </div>
                <div className="grid grid-cols-2 gap-1 py-1">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/converters/stripe-json-to-excel" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon platform="stripe" className="w-4 h-4" />
                            <span className="font-medium">Stripe</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/converters/shopify-json-to-csv" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon platform="shopify" className="w-4 h-4" />
                            <span className="font-medium">Shopify</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/converters/salesforce-json-to-excel" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon platform="salesforce" className="w-4 h-4" />
                            <span className="font-medium">Salesforce</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/converters/hubspot-json-to-excel" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon platform="hubspot" className="w-4 h-4" />
                            <span className="font-medium">HubSpot</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/converters/jira-json-to-excel" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon platform="jira" className="w-4 h-4" />
                            <span className="font-medium">Jira</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link href="/converters/quickbooks-json-to-excel" className="flex items-center gap-2 p-1.5 text-xs">
                            <BrandIcon platform="quickbooks" className="w-4 h-4" />
                            <span className="font-medium">QuickBooks</span>
                        </Link>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-1.5" />

                <DropdownMenuItem asChild className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg p-2 text-xs">
                    <Link href={ROUTES.converters} className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Explore all 35+ converters &amp; formats
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
