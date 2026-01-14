'use client';

import { Column } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store/store";

interface DraggableHeaderProps<TData> {
    column: Column<TData, unknown>;
    children: React.ReactNode;
}

export function DraggableHeader<TData>({ column, children }: DraggableHeaderProps<TData>) {
    const { toggleColumnVisibility } = useAppStore(state => ({ toggleColumnVisibility: state.toggleColumnVisibility }));

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        // Ensure z-index is higher while dragging
        zIndex: isDragging ? 20 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between gap-1 group relative h-full w-full"
        >
            <div className="flex-1 truncate">
                {children}
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-move p-1 hover:bg-accent rounded"
                >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>

                {/* Column Actions Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                            <span className="sr-only">Menu</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                            <span className="h-1 w-1 rounded-full bg-muted-foreground mx-[1px]" />
                            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => toggleColumnVisibility(column.id)}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Hide Column
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
