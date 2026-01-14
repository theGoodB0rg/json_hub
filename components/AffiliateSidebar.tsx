import { AFFILIATE_PARTNERS } from '@/lib/affiliates';
import { Button } from '@/components/ui/button';
import { ExternalLink, Database, BarChart, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AffiliateSidebar() {
    return (
        <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="space-y-1">
                <h3 className="font-semibold text-sm tracking-tight text-muted-foreground uppercase">
                    Suggested Next Steps
                </h3>
                <p className="text-xs text-muted-foreground">
                    Do more with your converted data
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {AFFILIATE_PARTNERS.map((partner) => {
                    // Icon logic (temporary until SVGs are added)
                    let Icon = Database;
                    if (partner.id === 'monday') Icon = BarChart;
                    if (partner.id === 'make') Icon = Zap;

                    return (
                        <Card key={partner.id} className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors shadow-sm bg-muted/20">
                            <CardHeader className={`p-4 pb-2 ${partner.bgColor}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-md bg-white/20 backdrop-blur-sm ${partner.textColor}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <CardTitle className={`text-sm font-semibold ${partner.textColor}`}>
                                        {partner.name}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-3 space-y-3">
                                <div>
                                    <p className="text-sm font-medium leading-none mb-1.5">
                                        {partner.benefit}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-snug">
                                        {partner.description}
                                    </p>
                                </div>
                                <Button
                                    className="w-full h-8 text-xs gap-1.5"
                                    variant="outline"
                                    onClick={() => window.open(partner.affiliateUrl, '_blank')}
                                >
                                    Try for Free
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-auto p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-[10px] text-muted-foreground text-center">
                    These links help support free development.
                </p>
            </div>
        </div>
    );
}
