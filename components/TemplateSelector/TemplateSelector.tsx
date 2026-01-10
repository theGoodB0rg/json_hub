'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileJson, ChevronDown } from 'lucide-react';
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

export function TemplateSelector() {
    const { setRawInput, parseInput } = useAppStore();

    const handleSelectTemplate = (templateData: string) => {
        setRawInput(templateData);
        // Auto-parse after loading template
        setTimeout(() => parseInput(), 100);
    };

    const categories = {
        api: 'API Responses',
        ecommerce: 'E-commerce',
        analytics: 'Analytics',
        general: 'General'
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
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <FileJson className="h-4 w-4" />
                    Try Example
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Sample JSON Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(groupedTemplates).map(([category, templates]) => (
                    <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {categories[category as keyof typeof categories]}
                        </div>
                        {templates.map((template) => (
                            <DropdownMenuItem
                                key={template.id}
                                onClick={() => handleSelectTemplate(template.data)}
                                className="cursor-pointer"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{template.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {template.description}
                                    </span>
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
