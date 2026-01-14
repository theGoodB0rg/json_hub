'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface InlineEditProps {
    value: any;
    onSave: (newValue: any) => void;
    className?: string;
    type?: 'primitive' | 'key'; // 'key' could be used for editing object keys in future
}

export function InlineEdit({ value, onSave, className, type = 'primitive' }: InlineEditProps) {
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

    const handleSave = () => {
        setIsEditing(false);
        // Basic type conversion? For now keep as string or try to preserve type if it was number/boolean?
        // User probably expects strings for CSVs, but cleaning up is good.
        // Let's pass the string value for now, let the store/parser handle type inference if needed.
        // Or simple safe inference:
        let finalValue: any = tempValue;

        // Try to respect original type if simple
        if (typeof value === 'number' && !isNaN(Number(tempValue)) && tempValue.trim() !== '') {
            finalValue = Number(tempValue);
        } else if (typeof value === 'boolean') {
            if (tempValue.toLowerCase() === 'true') finalValue = true;
            if (tempValue.toLowerCase() === 'false') finalValue = false;
        }

        if (String(finalValue) !== String(value)) {
            onSave(finalValue);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempValue(String(value ?? ''));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 min-w-[100px]">
                <Input
                    ref={inputRef}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleSave} // Save on blur? Or cancel? Standard is save.
                    onKeyDown={handleKeyDown}
                    className="h-7 px-2 py-1 text-xs"
                />
            </div>
        );
    }

    const stringValue = String(value ?? '');

    return (
        <div
            className={cn(
                "group flex items-center gap-2 cursor-text hover:bg-accent/50 transition-colors rounded px-1 -ml-1 min-h-[24px]",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            title="Click to edit"
        >
            <span className={cn(
                "truncate",
                value === null ? "text-muted-foreground italic" : "",
                typeof value === 'number' ? "text-blue-600 dark:text-blue-400 font-mono" : "",
                typeof value === 'boolean' ? "text-purple-600 dark:text-purple-400 font-mono" : ""
            )}>
                {value === null ? 'null' : (stringValue === '' ? 'empty' : stringValue)}
            </span>
            {/* Pencil icon or indicator could go here on hover */}
        </div>
    );
}
