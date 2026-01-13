'use client';

import { useAppStore } from '@/lib/store/store';
import { Table2, GitBranch, TableCellsMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ViewModeToggle() {
    const { viewMode, setViewMode } = useAppStore();

    return (
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={viewMode === 'flat' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('flat')}
                        className="gap-1.5 h-8 text-xs"
                    >
                        <Table2 className="h-3.5 w-3.5" />
                        Flat
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Flat table view (spreadsheet style)</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="gap-1.5 h-8 text-xs"
                    >
                        <TableCellsMerge className="h-3.5 w-3.5" />
                        Table
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Table view (nested arrays expanded)</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={viewMode === 'nested' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('nested')}
                        className="gap-1.5 h-8 text-xs"
                    >
                        <GitBranch className="h-3.5 w-3.5" />
                        Nested
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Nested view (hierarchical structure)</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
