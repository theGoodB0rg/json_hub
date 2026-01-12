'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ShareButton } from '@/components/ShareButton/ShareButton';
import { ConversionHistory } from '@/components/ConversionHistory/ConversionHistory';
import { BatchProcessor } from '@/components/BatchProcessor/BatchProcessor';
import { ProjectManager } from '@/components/ProjectManager';

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[90%] max-w-[350px] rounded-xl">
                <DialogHeader className="text-left">
                    <DialogTitle className="flex items-center gap-2">
                        <img src="/icon.svg" alt="Logo" className="h-6 w-6" />
                        <span>Menu</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Main Actions */}
                    <div className="grid gap-2">
                        <ShareButton className="w-full justify-start [&_span]:!inline" />
                        <BatchProcessor className="w-full justify-start [&_span]:!inline" />
                        <ConversionHistory className="w-full justify-start [&_span]:!inline" />
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
            </DialogContent>
        </Dialog>
    );
}
