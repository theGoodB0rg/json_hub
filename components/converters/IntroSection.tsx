
import { ConverterPageConfig } from "@/lib/platform-data";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    pageConfig: ConverterPageConfig;
}

export function IntroSection({ pageConfig }: Props) {
    return (
        <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            {pageConfig.tldr && (
                <div className="mb-10 mx-auto max-w-2xl bg-muted/50 border border-primary/20 rounded-xl p-6 text-left shadow-sm">
                    <div className="flex gap-4 items-start">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Quick Answer</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {pageConfig.tldr}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-3xl font-bold mb-6">Why use {pageConfig.h1}?</h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {pageConfig.content.intro}
            </p>
        </div>
    );
}
