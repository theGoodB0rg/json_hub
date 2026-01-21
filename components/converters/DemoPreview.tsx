
import { ConverterPageConfig } from "@/lib/platform-data";
import { Card } from "@/components/ui/card";

interface Props {
    pageConfig: ConverterPageConfig;
}

export function DemoPreview({ pageConfig }: Props) {
    return (
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            <h3 className="text-2xl font-bold mb-6 text-center">See It In Action</h3>
            <Card className="p-6 bg-muted/50 border-2 border-dashed">
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Preview of {pageConfig.platformName} conversion coming soon.</p>
                    {/* 
                        TODO: Implement actual interactive demo here.
                        For now, we place a placeholder.
                        In future phases, we will load sample JSON from /public/samples/{slug}.json
                        and show a before/after grid.
                     */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <span className="text-2xl">👀</span>
                    </div>
                    <p className="text-sm">Click &quot;Load Demo Data&quot; in the converter above to test with real {pageConfig.platformName} files.</p>
                </div>
            </Card>
        </div>
    );
}
