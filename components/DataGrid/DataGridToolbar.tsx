'use client';

import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Columns } from 'lucide-react';
import { useAppStore } from '@/lib/store/store';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ViewModeToggle } from './ViewModeToggle';

export function DataGridToolbar() {
    const {
        schema,
        excludedColumns,
        toggleColumnVisibility,
        undo,
        redo,
        pastStates,
        futureStates
    } = useAppStore(state => ({
        schema: state.schema,
        excludedColumns: state.excludedColumns,
        toggleColumnVisibility: state.toggleColumnVisibility,
        flatData: state.flatData,
        undo: state.undo,
        redo: state.redo,
        pastStates: state.pastStates,
        futureStates: state.futureStates
    }));

    const canUndo = useAppStore.temporal?.getState().pastStates.length > 0;
    const canRedo = useAppStore.temporal?.getState().futureStates.length > 0;

    return (
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2 p-1 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center gap-1 border-r border-border/50 pr-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => useAppStore.temporal.getState().undo()}
                                disabled={!canUndo}
                            >
                                <Undo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => useAppStore.temporal.getState().redo()}
                                disabled={!canRedo}
                            >
                                <Redo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex-1" />

            <ViewModeToggle />

            <div className="h-4 w-[1px] bg-border/50 mx-1" />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Columns className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Columns</span>
                        <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                            {schema.length - excludedColumns.length}/{schema.length}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-auto">
                    <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {schema.map((col) => (
                        <DropdownMenuCheckboxItem
                            key={col}
                            checked={!excludedColumns.includes(col)}
                            onCheckedChange={() => toggleColumnVisibility(col)}
                        >
                            {col}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
