'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton/ShareButton';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConversionHistory } from '@/components/ConversionHistory/ConversionHistory';
import { BatchProcessor } from '@/components/BatchProcessor/BatchProcessor';
import { ProjectManager } from '@/components/ProjectManager';

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 mb-8 px-2">
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
                <div className="flex flex-col gap-4 py-4">
                    {/* Main Actions */}
                    <div className="grid gap-2">
                        <ShareButton className="w-full justify-start [&_span]:!inline" />
                        <BatchProcessor className="w-full justify-start [&_span]:!inline" />
                        <ConversionHistory className="w-full justify-start [&_span]:!inline" />
                        <Button variant="ghost" asChild className="w-full justify-start text-muted-foreground">
                            <Link href="/blog">
                                <span>Blog</span>
                            </Link>
                        </Button>
                    </div>

                    <div className="h-px bg-border my-2" />

                    {/* Project Management */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Projects</h4>
                        <div className="flex flex-col gap-2 [&>div]:w-full [&_button]:flex-1">
                            <ProjectManager className="w-full justify-between [&_span]:!inline" />
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
