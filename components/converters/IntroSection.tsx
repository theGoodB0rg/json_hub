
import { ConverterPageConfig } from "@/lib/platform-data";

interface Props {
    pageConfig: ConverterPageConfig;
}

export function IntroSection({ pageConfig }: Props) {
    return (
        <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <h2 className="text-3xl font-bold mb-6">Why use {pageConfig.h1}?</h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {pageConfig.content.intro}
            </p>
        </div>
    );
}
