'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileJson, ChevronDown, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store/store';
import { JSON_TEMPLATES } from '@/lib/templates/jsonTemplates';
import { BrandIcon } from '@/components/ui/BrandIcon';

export function TemplateSelector({ platform }: { platform?: string }) {
    const { setRawInput, parseInput } = useAppStore();

    const handleSelectTemplate = (templateData: string) => {
        setRawInput(templateData);
        // Auto-parse after loading template
        setTimeout(() => parseInput(), 100);
    };

    const categories: Record<string, string> = {
        api: 'API Responses',
        ecommerce: 'E-commerce',
        analytics: 'Analytics',
        general: 'General',
        salesforce: 'Salesforce (CRM)',
        jira: 'Jira (Project Mgmt)',
        mixpanel: 'Mixpanel (Product Analytics)',
        make: 'Make.com (Automation)',
        amplitude: 'Amplitude (Product Analytics)'
    };

    const groupedTemplates = JSON_TEMPLATES.reduce((acc, template) => {
        if (!acc[template.category]) {
            acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
    }, {} as Record<string, typeof JSON_TEMPLATES>);

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 px-2.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="hidden lg:inline font-medium">Try Example</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Load Sample Dataset</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-72 max-h-96 overflow-y-auto shadow-xl border-border/60">
                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                    Sample Datasets &amp; Templates
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(groupedTemplates)
                    .sort(([catA], [catB]) => {
                        // Prioritize platform specific category
                        if (platform && catA === platform) return -1;
                        if (platform && catB === platform) return 1;
                        return 0;
                    })
                    .map(([category, templates]) => (
                        <div key={category}>
                            <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider bg-muted/30">
                                <BrandIcon platform={category} className="w-3.5 h-3.5" />
                                <span>{categories[category] || category}</span>
                            </div>
                            {templates.map((template) => (
                                <DropdownMenuItem
                                    key={template.id}
                                    onClick={() => handleSelectTemplate(template.data)}
                                    className="cursor-pointer py-2"
                                >
                                    <div className="flex items-start gap-2.5 w-full">
                                        <BrandIcon platform={template.category} className="w-4 h-4 mt-0.5 shrink-0" />
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                            <span className="font-medium text-xs leading-tight truncate">{template.name}</span>
                                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                                                {template.description}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                        </div>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
