import { Card } from "@/components/ui/card";
import { ExternalLink, Database, BarChart3, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffiliateLink {
    name: string;
    description: string;
    icon: React.ElementType;
    url: string;
    buttonText: string;
    tag?: string;
}

const AFFILIATE_LINKS: AffiliateLink[] = [
    {
        name: "Airtable",
        description: "Turn your JSON data into powerful, collaborative databases.",
        icon: Database,
        url: "https://airtable.com/invite/r/YOUR_AFFILIATE_ID", // TODO: Replace with your Airtable affiliate ID
        buttonText: "Try Free",
        tag: "Recommended"
    },
    {
        name: "Notion",
        description: "Organize and analyze your exported data in beautiful docs.",
        icon: BarChart3,
        url: "https://www.notion.so/?r=YOUR_AFFILIATE_ID", // TODO: Replace with your Notion affiliate ID
        buttonText: "Get Started"
    },
    {
        name: "Zapier",
        description: "Automate JSON conversions in your workflows.",
        icon: Shield,
        url: "https://zapier.com/sign-up?via=YOUR_AFFILIATE_ID", // TODO: Replace with your Zapier affiliate ID
        buttonText: "Automate"
    }
];

export function AffiliateSidebar() {
    return (
        <Card className="h-full bg-muted/20 border-l border-border/50 rounded-none w-full md:w-64 flex flex-col p-4 gap-6 overflow-y-auto">
            <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-blue-500" />
                    Recommended Tools
                </h3>
                <p className="text-xs text-muted-foreground">
                    Power up your data workflow
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {AFFILIATE_LINKS.map((link, index) => (
                    <div key={index} className="group relative">
                        {link.tag && (
                            <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded-full border border-blue-500/20">
                                {link.tag}
                            </span>
                        )}
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener sponsored"
                            className="block p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-all duration-300 hover:shadow-md hover:border-primary/20"
                        >
                            <div className="flex items-start gap-3 mb-2">
                                <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <link.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold leading-none mb-1 group-hover:text-primary transition-colors">
                                        {link.name}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                        {link.description}
                                    </p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" className="w-full text-xs h-7 bg-background group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                {link.buttonText} <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                            </Button>
                        </a>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-border/20">
                <p className="text-[10px] text-muted-foreground text-center">
                    We may earn a commission if you use these links, at no extra cost to you.
                </p>
            </div>
        </Card>
    );
}
