"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FileCode, FileSpreadsheet, ArrowRight, Loader2 } from "lucide-react";

const SAMPLE_JSON = `{
  "orders": [
    {
      "id": "ORD-001",
      "customer": {
        "name": "Alex Chen",
        "email": "alex@tech.co"
      },
      "items": ["Laptop", "Mouse"],
      "total": 1299.99
    },
    {
      "id": "ORD-002",
      "customer": {
        "name": "Sarah Jones",
        "email": "sarah@design.io"
      },
      "items": ["Monitor"],
      "total": 349.50
    }
  ]
}`;

const SAMPLE_DATA = [
    { id: "ORD-001", name: "Alex Chen", email: "alex@tech.co", items: "Laptop, Mouse", total: "$1,299.99" },
    { id: "ORD-002", name: "Sarah Jones", email: "sarah@design.io", items: "Monitor", total: "$349.50" },
];

export function HeroAnimation() {
    const [step, setStep] = useState<"json" | "processing" | "table">("json");

    useEffect(() => {
        const loop = () => {
            // Start as JSON
            setStep("json");

            // After 2.5s, start processing
            setTimeout(() => {
                setStep("processing");

                // After 1s processing, show table
                setTimeout(() => {
                    setStep("table");

                    // Show table for 4s, then restart
                    // The total cycle is 2.5 + 1 + 4 = 7.5s
                }, 800);
            }, 2500);
        };

        loop();
        const interval = setInterval(loop, 7500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-xl mx-auto perspective-1000">
            <div className={cn(
                "relative bg-card border rounded-xl shadow-2xl overflow-hidden transition-all duration-700 transform",
                step === "table" ? "rotate-y-0" : "rotate-y-0" // Kept simple for now, can add 3D flip later
            )}>
                {/* Fake Browser Toolbar */}
                <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex-1 text-center text-xs text-muted-foreground font-medium font-mono">
                        {step === "json" ? "raw_data.json" : "clean_export.xlsx"}
                    </div>
                </div>

                {/* Content Window */}
                <div className="relative h-[280px] bg-card/50">

                    {/* View: JSON Code */}
                    <div className={cn(
                        "absolute inset-0 p-4 transition-opacity duration-500 overflow-hidden font-mono text-sm",
                        step === "json" ? "opacity-100 z-10" : "opacity-0 z-0"
                    )}>
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                            <FileCode className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider">Input: Nested JSON</span>
                        </div>
                        <pre className="text-xs leading-relaxed text-blue-600 dark:text-blue-400">
                            {SAMPLE_JSON}
                        </pre>
                    </div>

                    {/* View: Processing State */}
                    <div className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
                        step === "processing" ? "opacity-100 z-20" : "opacity-0 pointer-events-none z-0"
                    )}>
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                            <div className="relative bg-primary text-primary-foreground p-3 rounded-full shadow-lg">
                                <ArrowRight className="w-6 h-6 animate-pulse" />
                            </div>
                        </div>
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 animate-pulse">
                            Flattening Nested Objects...
                        </div>
                    </div>

                    {/* View: Table */}
                    <div className={cn(
                        "absolute inset-0 p-0 transition-all duration-500 bg-card",
                        step === "table" ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-4 z-0"
                    )}>
                        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <FileSpreadsheet className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Output: Clean Table</span>
                            </div>
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground h-5">
                                4 Columns Found
                            </div>
                        </div>

                        <div className="p-0 overflow-hidden">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full caption-bottom text-[10px] sm:text-sm min-w-[280px]">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted hover:bg-transparent">
                                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-[10px] font-bold text-primary">ID</th>
                                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-[10px] font-bold text-primary">Customer Name</th>
                                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-[10px] font-bold text-primary">Items</th>
                                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-[10px] font-bold text-right text-primary">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {SAMPLE_DATA.map((row) => (
                                            <tr key={row.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 py-2 text-xs font-medium">{row.id}</td>
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 py-2 text-xs">{row.name}</td>
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 py-2 text-xs text-muted-foreground whitespace-nowrap">{row.items}</td>
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 py-2 text-xs text-right font-mono">{row.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Success Toast Simulation */}
                        <div className="absolute bottom-4 right-4 bg-green-500 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-in slide-in-from-bottom-2 fade-in">
                            Done (0.02s)
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
