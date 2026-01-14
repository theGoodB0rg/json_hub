'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableCellProps {
    value: unknown;
    rowIndex: number;
    columnId: string;
    updateCell: (rowIndex: number, columnId: string, value: any) => void;
    className?: string;
}

export function EditableCell({ value, rowIndex, columnId, updateCell, className }: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(String(value ?? ''));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTempValue(String(value ?? ''));
    }, [value]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (tempValue !== String(value ?? '')) {
            updateCell(rowIndex, columnId, tempValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTempValue(String(value ?? '')); // Revert
        }
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-full w-full min-h-[32px] px-2 py-1 rounded-none border-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
            />
        );
    }

    const stringValue = String(value ?? '');

    return (
        <div
            className={cn("px-2 py-1 min-h-[32px] cursor-text hover:bg-accent/50 transition-colors truncate", className)}
            onClick={() => setIsEditing(true)}
            title={stringValue} // Native tooltip as fallback
        >
            {value === null ? (
                <span className="text-muted-foreground italic">null</span>
            ) : stringValue === '' ? (
                <span className="text-muted-foreground/30 italic">empty</span>
            ) : (
                stringValue
            )}
        </div>
    );
}
