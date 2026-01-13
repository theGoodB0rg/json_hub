'use client';

import Image from 'next/image';

import { ModeToggle } from "@/components/mode-toggle";
import { ProjectManager } from "@/components/ProjectManager";
import { JsonEditor } from '@/components/JsonEditor/JsonEditor';
import { DataGrid } from '@/components/DataGrid/DataGrid';
import { ExportMenu } from '@/components/ExportMenu/ExportMenu';
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ShieldCheck, Zap, Code2, Lock, Github } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AffiliateSidebar } from "@/components/AffiliateSidebar";
import { Testimonials } from "@/components/Testimonials";
import { UsageStats } from "@/components/UsageStats";
import { ConversionHistory } from "@/components/ConversionHistory/ConversionHistory";
import { FAQ } from "@/components/FAQ";
import { ShareButton } from "@/components/ShareButton/ShareButton";
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/store';
import { BatchProcessor } from "@/components/BatchProcessor/BatchProcessor";
import { MobileNav } from "@/components/MobileNav";

interface ConverterAppProps {
    heading?: React.ReactNode;
    subheading?: string;
}

export function ConverterApp({ heading, subheading }: ConverterAppProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const { setRawInput, parseInput } = useAppStore();

    // Auto-load JSON from shareable URL on mount
    useEffect(() => {
        const loadSharedData = async () => {
            const { loadFromShareableLink } = await import('@/lib/utils/shareLink');
            const sharedData = loadFromShareableLink();

            if (sharedData) {
                setRawInput(sharedData);
                // Auto-parse after a short delay to ensure UI is ready
                setTimeout(() => parseInput(), 100);
            }
        };

        loadSharedData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run on mount

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/10">
            {/* Glassmorphic Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image src="/icon.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />

                        <span className="font-bold text-lg tracking-tight">JsonExport</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            <span>Privacy-First & Secure</span>
                        </div>
                        <div className="h-6 w-px bg-border/50 hidden md:block" />

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-4">
                            <ConversionHistory />
                            <a href="/blog" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                Blog
                            </a>
                            <ShareButton />
                            <BatchProcessor />
                            <ProjectManager />
                        </div>

                        {/* Mobile Navigation & Theme */}
                        <div className="flex items-center gap-2 md:hidden">
                            <ModeToggle />
                            <MobileNav />
                        </div>

                        <div className="hidden md:block">
                            <ModeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col">
                {/* Hero Section */}
                <section className="py-12 md:py-20 px-4 text-center relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Zap className="h-3.5 w-3.5" />
                            <span>Instant Conversion. Zero Latency.</span>
                        </div>

                        {heading || (
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                                Stop Wrestling with JSON. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                                    Convert to Excel Instantly.
                                </span>
                            </h1>
                        )}

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                            {subheading || "The easiest way to turn raw data into readable spreadsheets. 100% Private. No software to install. No coding required."}
                        </p>
                    </div>
                </section>

                {/* Usage Statistics */}
                <UsageStats />

                {/* Main App Interface */}
                <section className="flex-1 px-4 pb-8 container mx-auto">
                    <div className={cn(
                        "border border-border/50 rounded-xl shadow-2xl bg-card overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 ring-1 ring-white/10",
                        isDesktop ? "h-[800px]" : "min-h-[600px]"
                    )}>
                        <div className="flex flex-row h-full">
                            <div className="flex-1 h-full overflow-hidden">
                                {isDesktop ? (
                                    <ResizablePanelGroup
                                        orientation="horizontal"
                                        className="h-full"
                                    >
                                        <ResizablePanel defaultSize={40} minSize={30} className="bg-background/50">
                                            <div className="h-full p-0 flex flex-col">
                                                <div className="h-10 border-b border-border/50 px-4 flex items-center justify-between bg-muted/20">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input JSON</span>
                                                    <span className="text-[10px] text-muted-foreground">Auto-detects format</span>
                                                </div>
                                                <div className="flex-1 overflow-hidden relative group">
                                                    <JsonEditor />
                                                </div>
                                            </div>
                                        </ResizablePanel>

                                        <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors w-1.5" />

                                        <ResizablePanel defaultSize={60} minSize={30} className="bg-background">
                                            <div className="h-full flex flex-col">
                                                <div className="h-10 border-b border-border/50 px-4 flex items-center justify-between bg-muted/20">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Grid Preview</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                        <span className="text-[10px] text-muted-foreground">Live App</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-hidden p-4">
                                                    <DataGrid />
                                                </div>
                                                <div className="p-4 border-t border-border/50 bg-muted/10 backdrop-blur-sm">
                                                    <ExportMenu />
                                                </div>
                                            </div>
                                        </ResizablePanel>
                                    </ResizablePanelGroup>
                                ) : (
                                    <Tabs defaultValue="input" className="h-full flex flex-col">
                                        <div className="px-4 pt-4 bg-muted/10 border-b border-border/40">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="input" className="gap-2">
                                                    <Code2 className="h-4 w-4" />
                                                    Input
                                                </TabsTrigger>
                                                <TabsTrigger value="preview" className="gap-2">
                                                    <Zap className="h-4 w-4" />
                                                    Preview
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <TabsContent value="input" className="flex-1 mt-0 h-full flex flex-col data-[state=inactive]:hidden">
                                            <div className="flex-1 overflow-hidden relative border-b border-border/40">
                                                <JsonEditor />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="preview" className="flex-1 mt-0 h-full flex flex-col data-[state=inactive]:hidden">
                                            <div className="flex-1 overflow-hidden p-2">
                                                <DataGrid />
                                            </div>
                                            <div className="p-4 border-t border-border/50 bg-muted/10 backdrop-blur-sm">
                                                <ExportMenu />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                )}
                            </div>
                            <div className="hidden lg:block h-full border-l border-border/50 w-64 bg-background/50 backdrop-blur-sm">
                                <AffiliateSidebar />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <Testimonials />

                {/* FAQ Section */}
                <FAQ />
            </main>
        </div>
    );
}
