'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';

const codeSnippet = {
    users: [
        {
            id: 1,
            name: "Alice",
            contact: {
                email: "alice@example.com",
                phone: "555-0100"
            }
        },
        {
            id: 2,
            name: "Bob",
            contact: {
                email: "bob@example.com",
                phone: "555-0101"
            }
        }
    ]
};

export function FlatteningVisualizer() {
    const [step, setStep] = useState<'json' | 'flattening' | 'table'>('json');

    const startAnimation = () => {
        setStep('flattening');
        setTimeout(() => setStep('table'), 1500);
    };

    const reset = () => {
        setStep('json');
    };

    return (
        <div className="w-full max-w-4xl mx-auto my-12 p-6 bg-card border rounded-xl shadow-lg overflow-hidden">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">How Flattening Works</h3>
                <p className="text-muted-foreground">Watch how nested JSON objects are transformed into flat table rows.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-center min-h-[400px] relative">

                {/* JSON View (Source) */}
                <motion.div
                    initial={false}
                    animate={{
                        x: step === 'table' ? -50 : 0,
                        opacity: step === 'table' ? 0.0 : 1,
                        scale: step === 'table' ? 0.8 : 1
                    }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-6 font-mono text-sm text-green-400 w-full max-w-sm shadow-2xl z-10"
                >
                    <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="ml-auto text-xs text-neutral-500">source.json</span>
                    </div>
                    <pre className="overflow-hidden">
                        <code>{JSON.stringify(codeSnippet, null, 2)}</code>
                    </pre>
                </motion.div>

                {/* Arrow Transition */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <AnimatePresence>
                        {step === 'flattening' && (
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1.5, rotate: 0 }}
                                exit={{ scale: 0, x: 100 }}
                                className="text-primary"
                            >
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Excel View (Target) */}
                <motion.div
                    initial={{ x: 50, opacity: 0, scale: 0.9 }}
                    animate={{
                        x: step === 'table' ? 0 : 50,
                        opacity: step === 'table' ? 1 : 0,
                        scale: step === 'table' ? 1 : 0.9
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex-1 bg-white dark:bg-neutral-900 border rounded-lg overflow-hidden w-full max-w-sm shadow-2xl absolute md:static inset-0 md:inset-auto h-fit"
                >
                    <div className="bg-green-600 px-4 py-2 flex items-center justify-between text-white">
                        <span className="font-semibold text-sm">Output.xlsx</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-white/50 rounded-full" />
                            <div className="w-2 h-2 bg-white/50 rounded-full" />
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-4 bg-muted border-b text-[10px] font-bold py-2 px-1 gap-1">
                        <div className="bg-background border rounded px-1 py-0.5">id</div>
                        <div className="bg-background border rounded px-1 py-0.5">name</div>
                        <div className="bg-background border rounded px-1 py-0.5 text-blue-600">contact.email</div>
                        <div className="bg-background border rounded px-1 py-0.5 text-blue-600">contact.phone</div>
                    </div>

                    {/* Table Rows - Animated */}
                    <div className="p-1 space-y-1">
                        {[0, 1].map((idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + (idx * 0.2) }}
                                className="grid grid-cols-4 text-xs gap-1 border-b last:border-0 pb-1"
                            >
                                <div className="p-1">{codeSnippet.users[idx].id}</div>
                                <div className="p-1">{codeSnippet.users[idx].name}</div>
                                <div className="p-1 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded font-mono text-[10px] flex items-center overflow-hidden">
                                    {codeSnippet.users[idx].contact.email}
                                </div>
                                <div className="p-1 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded font-mono text-[10px] flex items-center">
                                    {codeSnippet.users[idx].contact.phone}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="flex justify-center mt-8">
                {step === 'json' ? (
                    <Button onClick={startAnimation} size="lg" className="gap-2 text-lg px-8">
                        <Play className="w-5 h-5 fill-current" />
                        Visualize Flattening
                    </Button>
                ) : step === 'table' ? (
                    <Button onClick={reset} variant="outline" size="lg" className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Replay
                    </Button>
                ) : (
                    <Button disabled size="lg" className="opacity-80">
                        Processing...
                    </Button>
                )}
            </div>
        </div>
    );
}
