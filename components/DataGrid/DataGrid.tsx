'use client';

import { useAppStore } from '@/lib/store/store';
import { Card } from '@/components/ui/card';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from '@tanstack/react-table';
import { useMemo } from 'react';

export function DataGrid() {
    const { flatData, schema, updateCell } = useAppStore();

    const columns: ColumnDef<Record<string, any>>[] = useMemo(
        () =>
            schema.map((key) => ({
                accessorKey: key,
                header: key,
                cell: ({ getValue, row, column }) => {
                    const value = getValue();
                    return (
                        <div
                            className="px-2 py-1 min-h-[32px] cursor-pointer hover:bg-accent"
                            onDoubleClick={() => {
                                const newValue = prompt(`Edit ${key}:`, String(value ?? ''));
                                if (newValue !== null) {
                                    updateCell(row.index, column.id, newValue);
                                }
                            }}
                        >
                            {value === null ? (
                                <span className="text-muted-foreground italic">null</span>
                            ) : (
                                String(value)
                            )}
                        </div>
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
        <Card className="h-full flex flex-col p-4">
            <div className="mb-4">
                <h2 className="text-lg font-semibold">Table Preview</h2>
                <p className="text-sm text-muted-foreground">
                    {flatData.length} rows × {schema.length} columns (Double-click to edit)
                </p>
            </div>

            <div className="flex-1 overflow-auto border rounded-md">
                <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-2 py-2 text-left font-semibold border-b"
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
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
            </div>
        </Card>
    );
}
