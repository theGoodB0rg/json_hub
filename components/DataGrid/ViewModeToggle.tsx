'use client';

import { useAppStore } from '@/lib/store/store';
import { Table2, GitBranch, TableCellsMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ViewModeToggle() {
    const { viewMode, setViewMode } = useAppStore();

    return (
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30">
            <Button
                variant={viewMode === 'flat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('flat')}
                className="gap-1.5 h-8 text-xs"
                title="Flat table view (spreadsheet style with dot notation)"
            >
                <Table2 className="h-3.5 w-3.5" />
                Flat
            </Button>
            <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="gap-1.5 h-8 text-xs"
                title="Table view (nested arrays expanded into rows)"
            >
                <TableCellsMerge className="h-3.5 w-3.5" />
                Table
            </Button>
            <Button
                variant={viewMode === 'nested' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('nested')}
                className="gap-1.5 h-8 text-xs"
                title="Nested view (hierarchical structure)"
            >
                <GitBranch className="h-3.5 w-3.5" />
                Nested
            </Button>
        </div>
    );
}
