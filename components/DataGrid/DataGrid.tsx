'use client';

import { useAppStore } from '@/lib/store/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { NestedTable } from './NestedTable';
import { ViewModeToggle } from './ViewModeToggle';
import { TableViewGrid } from './TableViewGrid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DataGrid() {
    const { flatData, schema, parsedData, viewMode, updateCell } = useAppStore();
    const [isMaximized, setIsMaximized] = useState(false);

    const columns: ColumnDef<Record<string, any>>[] = useMemo(
        () =>
            schema.map((key) => ({
                id: key,
                accessorFn: (row) => row[key], // Fix: Use accessorFn to treat dot keys as literal properties
                header: key,
                cell: ({ getValue, row, column }) => {
                    const value = getValue();
                    const stringValue = String(value ?? '');
                    const isTruncated = stringValue.length > 100;
                    const displayValue = isTruncated ? stringValue.substring(0, 100) + '...' : stringValue;

                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="px-2 py-1 min-h-[32px] cursor-pointer hover:bg-accent max-w[300px]"
                                        onDoubleClick={() => {
                                            const newValue = prompt(`Edit ${key}:`, stringValue);
                                            if (newValue !== null) {
                                                updateCell(row.index, column.id, newValue);
                                            }
                                        }}
                                    >
                                        {value === null ? (
                                            <span className="text-muted-foreground italic">null</span>
                                        ) : (
                                            <span className="truncate block">{displayValue}</span>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs break-all">{stringValue}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
            })),
        [schema, updateCell]
    );

    const table = useReactTable({
        data: flatData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (flatData.length === 0) {
        return (
            <Card className="h-full flex items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg font-semibold mb-2">No data to display</p>
                    <p className="text-sm">Parse JSON in the input pane to see the table preview</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "flex flex-col transition-all duration-300",
            isMaximized ? "fixed inset-0 z-[100] h-[100dvh] w-screen rounded-none bg-background p-2 md:p-4" : "h-full p-2 md:p-4"
        )}>
            <div className="mb-2 md:mb-4 flex flex-col md:flex-row justify-between items-start gap-2 md:gap-0">
                <div>
                    <h2 className="text-base md:text-lg font-semibold">
                        {viewMode === 'flat' ? 'Table Preview' : viewMode === 'table' ? 'Table View (Nested)' : 'Nested View'}
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {viewMode === 'flat'
                            ? `${flatData.length} rows × ${schema.length} columns (Double-click to edit)`
                            : viewMode === 'table'
                                ? 'Hierarchical view with nested tables in cells'
                                : 'Hierarchical JSON structure'}
                    </p>
                </div>
                <div className="flex gap-2 self-end md:self-auto">
                    <ViewModeToggle />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden"
                                >
                                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                    <span className="sr-only">{isMaximized ? "Minimize" : "Maximize"}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isMaximized ? "Minimize" : "Maximize"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-md">
                {viewMode === 'table' ? (
                    <TableViewGrid data={parsedData} />
                ) : viewMode === 'flat' ? (
                    <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-2 py-2 text-left font-semibold border-b min-w-[120px] max-w-[300px]"
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="truncate w-full cursor-help">
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{header.id}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="border-b hover:bg-muted/50">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="border-r last:border-r-0">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-4">
                        <NestedTable data={parsedData} />
                    </div>
                )}
            </div>
        </Card >
    );
}
