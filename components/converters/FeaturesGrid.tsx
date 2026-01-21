
import { ConverterPageConfig } from "@/lib/platform-data";
import { Card } from "@/components/ui/card";
import { CheckCircle2, FileJson } from 'lucide-react';

interface Props {
    pageConfig: ConverterPageConfig;
}

export function FeaturesGrid({ pageConfig }: Props) {
    return (
        <div className="grid md:grid-cols-2 gap-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Card className="p-8 border-primary/20 bg-primary/5">
                <div className="flex items-start gap-4">
                    <FileJson className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-xl mb-2">Native Support</h3>
                        <p className="text-muted-foreground">
                            Specifically tuned to handle the quirks and nested structures of <strong>{pageConfig.platformName}</strong> JSON data.
                        </p>
                    </div>
                </div>
            </Card>
            <div className="space-y-4">
                {pageConfig.content.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-lg">{feature}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
