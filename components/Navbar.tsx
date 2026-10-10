'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Zap } from 'lucide-react';
import { ConvertersNavDropdown } from '@/components/ConvertersNavDropdown';
import { ConversionHistory } from '@/components/ConversionHistory/ConversionHistory';
import { ShareButton } from '@/components/ShareButton/ShareButton';
import { BatchProcessor } from '@/components/BatchProcessor/BatchProcessor';
import { ProjectManager } from '@/components/ProjectManager';
import { ModeToggle } from '@/components/mode-toggle';
import { MobileNav } from '@/components/MobileNav';
import { useProStore } from '@/lib/store/proStore';
import { ROUTES } from '@/lib/routes';

export function Navbar() {
    const { isPro } = useProStore();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
                {/* Persistent Clickable Brand / Home Navigation */}
                <Link
                    href={ROUTES.home}
                    className="flex items-center gap-2.5 shrink-0 group transition-opacity hover:opacity-90"
                    title="JsonExport Home"
                >
                    <Image
                        src="/icon.svg"
                        alt="JsonExport Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 transition-transform duration-200 group-hover:scale-105"
                        priority
                    />
                    <span className="font-bold text-lg tracking-tight whitespace-nowrap text-foreground group-hover:text-primary transition-colors">
                        JsonExport
                    </span>
                    {isPro && (
                        <span className="ml-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                            PRO
                        </span>
                    )}
                </Link>

                {/* Right Side Navigation Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Privacy Badge - Displayed on wide screens (>= xl) */}
                    <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50 shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="whitespace-nowrap">Privacy-First & Secure</span>
                    </div>
                    <div className="h-6 w-px bg-border/50 hidden xl:block shrink-0" />

                    {/* Desktop Navigation on Wide Screens (>= lg) */}
                    <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                        <ConvertersNavDropdown />
                        <ConversionHistory />
                        <Link
                            href={ROUTES.blog}
                            className="hidden xl:inline-block text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap px-1"
                        >
                            Blog
                        </Link>
                        <Link
                            href={ROUTES.recommendedTools}
                            className="hidden xl:inline-block text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap px-1"
                        >
                            Recommended Tools
                        </Link>
                        {/*
                          M3: amber-filled Pro CTA, visible from md breakpoint
                          and up (phones use MobileNav drawer). High-contrast
                          against the muted primary nav links so it reads as
                          an action, not a link. Gentle 3s pulse — subtle but
                          enough to catch peripheral vision on a long dwell.
                        */}
                        <Link
                            href={ROUTES.desktop}
                            className="hidden md:inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 shadow-sm shadow-amber-500/30 ring-1 ring-amber-500/50 transition-colors motion-safe:animate-pulse-gentle"
                            aria-label="Upgrade to JsonExport Pro — $9 one-time, lifetime license"
                        >
                            <Zap className="h-3.5 w-3.5" aria-hidden />
                            Get Pro
                            <span className="text-[10px] font-semibold text-amber-900/80 border-l border-amber-700/40 pl-1.5 ml-0.5">$9</span>
                        </Link>
                        <ShareButton />
                        <BatchProcessor />
                        <ProjectManager />
                    </div>

                    {/* Mid-screen compact Converters button (sm to lg) */}
                    <div className="hidden sm:flex lg:hidden items-center gap-1.5">
                        <ConvertersNavDropdown />
                    </div>

                    {/* Theme Toggle */}
                    <ModeToggle />

                    {/* Mobile & Tablet Slide-Out Drawer (< lg) */}
                    <div className="lg:hidden flex items-center">
                        <MobileNav />
                    </div>
                </div>
            </div>
        </header>
    );
}
