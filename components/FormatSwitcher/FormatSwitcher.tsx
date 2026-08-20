'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { useAppStore } from '@/lib/store/store';
import { pluginRegistry } from '@/lib/plugins/registry';
import { ChevronDown, ArrowRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FormatSwitcher({ className }: { className?: string }) {
    const { activePluginId, setPluginId, parseInput } = useAppStore();
    const plugins = pluginRegistry.getAll();
    const currentPlugin = pluginRegistry.getOrDefault(activePluginId);

    const handleSelectPlugin = (pluginId: string) => {
        setPluginId(pluginId);
        setTimeout(() => parseInput(), 100);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "gap-2 px-2.5 h-8 border-border/60 bg-background/80 hover:bg-muted font-medium text-xs shadow-sm",
                        className
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <BrandIcon format={currentPlugin.sourceFormat} className="w-3.5 h-3.5" />
                        <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                        <BrandIcon format={currentPlugin.targetFormat} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-foreground">
                        {currentPlugin.sourceFormat.toUpperCase()} &rarr; {currentPlugin.targetFormat === 'xlsx' ? 'Excel' : currentPlugin.targetFormat.toUpperCase()}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50 ml-0.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1.5 shadow-xl border-border/60">
                <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Select Conversion Engine
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                {plugins.map((plugin) => {
                    const isSelected = plugin.id === (activePluginId || 'json-to-excel');
                    return (
                        <DropdownMenuItem
                            key={plugin.id}
                            onClick={() => handleSelectPlugin(plugin.id)}
                            className={cn(
                                "cursor-pointer flex items-center justify-between p-2 rounded-lg text-xs transition-colors",
                                isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center gap-1">
                                    <BrandIcon format={plugin.sourceFormat} className="w-4 h-4" />
                                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    <BrandIcon format={plugin.targetFormat} className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span>{plugin.name}</span>
                                </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
