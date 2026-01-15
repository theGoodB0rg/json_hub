'use client';

import { useState, useRef, useEffect } from 'react';
import { Column } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, EyeOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    const { toggleColumnVisibility, renameColumn } = useAppStore(state => ({
        toggleColumnVisibility: state.toggleColumnVisibility,
        renameColumn: state.renameColumn,
    }));

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(column.id);
    const inputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleStartEdit = () => {
        setEditValue(column.id);
        setIsEditing(true);
    };

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== column.id) {
            renameColumn(column.id, trimmed);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(column.id);
        }
    };

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between gap-1 group relative h-full w-full px-2 py-1"
        >
            {isEditing ? (
                <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="h-6 text-xs px-1 py-0 flex-1"
                />
            ) : (
                <div
                    className="flex-1 truncate cursor-text font-medium text-xs"
                    onDoubleClick={handleStartEdit}
                    title={`Double-click to rename "${column.id}"`}
                >
                    {children}
                </div>
            )}

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
                        <DropdownMenuItem onClick={handleStartEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename Column
                        </DropdownMenuItem>
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

