'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BrandIcon } from '@/components/ui/BrandIcon';
import {
    CONVERTER_CATALOG,
    CATEGORY_LABELS,
    ConverterCategory,
    searchConverters,
    ConverterCatalogItem,
} from '@/lib/converters/catalog';
import {
    Search,
    X,
    ArrowRight,
    Sparkles,
    Filter,
    Layers,
    ShieldCheck,
    CheckCircle2,
    FileSpreadsheet,
    FileJson,
    FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES: ConverterCategory[] = [
    'all',
    'format',
    'crm',
    'ecommerce',
    'analytics',
    'project-management',
    'finance',
    'database',
    'communication',
    'automation',
];

export function ConverterDirectory() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ConverterCategory>('all');

    // Filter items by category and query
    const filteredItems = useMemo(() => {
        let items = CONVERTER_CATALOG;
        if (selectedCategory !== 'all') {
            items = items.filter((item) => item.category === selectedCategory);
        }
        return searchConverters(searchQuery, items);
    }, [searchQuery, selectedCategory]);

    // Format matrix items (core format-to-format conversions)
    const formatItems = useMemo(() => {
        return CONVERTER_CATALOG.filter((item) => !item.isPlatformIntegration);
    }, []);

    return (
        <div className="space-y-12">
            {/* Search & Category Filter Controls */}
            <div className="bg-card/70 border border-border/50 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 backdrop-blur-sm">
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search 35+ formats & platforms (e.g. Stripe, CSV, XML, Salesforce, Mixpanel, QuickBooks)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-10 py-6 text-base rounded-xl border-border/60 shadow-inner bg-background focus-visible:ring-primary"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
                    {CATEGORIES.map((cat) => {
                        const count = cat === 'all' ? CONVERTER_CATALOG.length : CONVERTER_CATALOG.filter(c => c.category === cat).length;
                        if (count === 0 && cat !== 'all') return null;

                        const isSelected = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border",
                                    isSelected
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <span>{CATEGORY_LABELS[cat]}</span>
                                <span className={cn(
                                    "px-1.5 py-0.2 rounded-full text-[10px]",
                                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Core Format Conversion Showcase (when no search query or in format view) */}
            {(!searchQuery && (selectedCategory === 'all' || selectedCategory === 'format')) && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Core Format Conversions</h2>
                            <p className="text-sm text-muted-foreground">High-performance, RFC-compliant format transformation engines</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formatItems.map((item) => (
                            <Link
                                key={item.slug}
                                href={item.href}
                                className="group block"
                            >
                                <Card className="p-5 h-full border border-border/50 hover:border-primary/50 transition-all hover:shadow-md bg-gradient-to-br from-card to-card/60 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <BrandIcon format={item.sourceFormat} className="w-7 h-7" />
                                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <BrandIcon format={item.targetFormat === 'excel' ? 'excel' : item.targetFormat} className="w-7 h-7" />
                                            </div>
                                            {item.badgeText && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                    {item.badgeText}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-3 border-t border-border/30 flex items-center justify-between text-xs font-semibold text-primary">
                                        <span>Convert Now</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Grid of Results */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                            {selectedCategory === 'all' ? 'All Platform & Format Converters' : CATEGORY_LABELS[selectedCategory]}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredItems.length} available converters
                        </p>
                    </div>
                </div>

                {filteredItems.length === 0 ? (
                    <Card className="p-12 text-center border-dashed border-2 bg-muted/20">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="text-lg font-bold">No converters found matching &quot;{searchQuery}&quot;</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                            Try searching for generic terms like &quot;JSON&quot;, &quot;CSV&quot;, &quot;Excel&quot;, or request a new platform integration.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            className="mt-4"
                        >
                            Reset Search Filters
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item) => (
                            <Link
                                key={item.slug}
                                href={item.href}
                                className="group block"
                            >
                                <Card className="p-5 h-full border border-border/50 hover:border-primary/50 transition-all hover:shadow-md bg-card/80 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <BrandIcon platform={item.platformName} format={!item.isPlatformIntegration ? item.sourceFormat : undefined} className="w-9 h-9" />
                                                <div>
                                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                        {item.sourceFormat.toUpperCase()} &rarr; {item.targetFormat === 'excel' ? 'XLSX' : item.targetFormat.toUpperCase()}
                                                    </span>
                                                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                                                        {item.platformName} to {item.targetFormat === 'excel' ? 'Excel' : item.targetFormat.toUpperCase()}
                                                    </h3>
                                                </div>
                                            </div>
                                            {item.badgeText && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                    {item.badgeText}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className="pt-4 mt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                                        <span className="capitalize">{CATEGORY_LABELS[item.category] || item.category}</span>
                                        <span className="flex items-center gap-1">
                                            Open Converter <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Privacy & Zero Server Callout Banner */}
            <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">100% Client-Side Private Conversion</h3>
                        <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
                            All converters process your data directly in browser memory via Web Workers. No files or records are ever sent to remote servers.
                        </p>
                    </div>
                </div>
                <Link
                    href="/privacy-security"
                    className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm"
                >
                    Learn About Security
                </Link>
            </div>
        </div>
    );
}
