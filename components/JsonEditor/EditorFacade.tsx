'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface EditorFacadeProps {
    value: string;
    onChange: (value: string) => void;
    onActivate: () => void;
    placeholder?: string;
    className?: string;
}

/**
 * Lightweight textarea facade that mimics Monaco Editor appearance.
 * Used for initial page load to avoid Monaco's heavy JS bundle blocking render.
 * Swapped for real Monaco on user interaction.
 */
export const EditorFacade = forwardRef<HTMLTextAreaElement, EditorFacadeProps>(
    ({ value, onChange, onActivate, placeholder, className }, ref) => {
        return (
            <div className={cn("relative h-full w-full", className)}>
                {/* Line numbers simulation */}
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1e1e1e] border-r border-[#3c3c3c] flex flex-col pt-3 text-right pr-2 text-xs text-[#858585] font-mono select-none pointer-events-none overflow-hidden">
                    {value.split('\n').slice(0, 100).map((_, i) => (
                        <div key={i} className="leading-[21px]">{i + 1}</div>
                    ))}
                    {!value && <div className="leading-[21px]">1</div>}
                </div>

                {/* Main textarea */}
                <textarea
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={onActivate}
                    onClick={onActivate}
                    placeholder={placeholder || 'Paste your JSON here or click "Try Example"...'}
                    spellCheck={false}
                    className={cn(
                        "w-full h-full resize-none border-0 outline-none",
                        "bg-[#1e1e1e] text-[#d4d4d4]",
                        "font-mono text-sm leading-[21px]",
                        "pl-12 pr-4 pt-3 pb-3",
                        "placeholder:text-[#6e7681]",
                        "focus:ring-0 focus:outline-none"
                    )}
                    style={{
                        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                        tabSize: 2,
                    }}
                />
            </div>
        );
    }
);

EditorFacade.displayName = 'EditorFacade';
