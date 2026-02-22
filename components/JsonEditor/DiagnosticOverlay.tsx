'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react';

interface DiagnosticOverlayProps {
    fileSize: number;
    rawInput: string;
    onComplete: () => void;
}

export function DiagnosticOverlay({ fileSize, rawInput, onComplete }: DiagnosticOverlayProps) {
    const [step, setStep] = useState(0);
    const [stats, setStats] = useState({ objects: 0, arrays: 0 });

    useEffect(() => {
        // Quick string analysis for theater
        const analyze = () => {
            const sample = rawInput.substring(0, 50000); // Only check first 50k chars for speed
            const objects = (sample.match(/\{/g) || []).length;
            const arrays = (sample.match(/\[/g) || []).length;

            // Extrapolate if file is much larger than sample
            const multiplier = rawInput.length > 50000 ? Math.ceil(rawInput.length / 50000) : 1;

            setStats({
                objects: objects * multiplier,
                arrays: arrays * multiplier
            });
        };

        analyze();

        // Theater timing
        const timer1 = setTimeout(() => setStep(1), 600);
        const timer2 = setTimeout(() => setStep(2), 1400);
        const timer3 = setTimeout(() => {
            setStep(3);
            onComplete();
        }, 2200);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [rawInput, onComplete]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">

                {/* Icon Animation */}
                <div className="relative">
                    {step < 3 ? (
                        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                            <Wrench className="w-8 h-8 text-primary animate-pulse" />
                            <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
                            <CheckCircle2 className="w-8 h-8 text-green-500 animate-in zoom-in duration-300" />
                        </div>
                    )}
                </div>

                <div className="space-y-4 w-full text-center">
                    {/* Step 0 */}
                    <div className={`transition-all duration-500 ${step >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <p className="text-sm font-medium text-foreground">
                            Analyzing {formatSize(fileSize)} file locally...
                        </p>
                    </div>

                    {/* Step 1 */}
                    <div className={`transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                                Detected {stats.objects.toLocaleString()} nested objects & {stats.arrays.toLocaleString()} arrays.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className={`transition-all duration-500 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            Repairing schema and flattening fields...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
