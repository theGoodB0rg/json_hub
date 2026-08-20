import Link from 'next/link';
import { Github, Lock, Zap, FileJson, FileSpreadsheet, FileText, ArrowRight, Code2 } from 'lucide-react';
import { LinkToUs } from '@/components/LinkToUs';
import { SocialProofBadges } from '@/components/SocialProofBadges';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { ROUTES } from '@/lib/routes';

export function Footer() {
    return (
        <footer className="py-14 border-t border-border/40 bg-muted/20">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-xl tracking-tight">JsonExport</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                            The privacy-first Data Analyst Workbench.
                            Visualize, flatten, and export complex JSON, CSV, XML, and Excel data 100% locally in your browser.
                        </p>
                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
                            <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-500" /> 100% Private</div>
                            <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> Zero Latency</div>
                            <div className="flex items-center gap-1.5"><FileJson className="w-3.5 h-3.5 text-blue-500" /> No Uploads</div>
                        </div>
                        <div className="pt-2">
                            <Link
                                href={ROUTES.converters}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
                            >
                                <span>Browse 35+ Converters Directory</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Format Converters */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-foreground tracking-tight">Format Engines</h3>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>
                                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon format="json" className="w-4 h-4" /> JSON to Excel
                                </Link>
                            </li>
                            <li>
                                <Link href="/json-to-csv" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon format="json" className="w-4 h-4" /> JSON to CSV
                                </Link>
                            </li>
                            <li>
                                <Link href="/csv-to-json" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon format="csv" className="w-4 h-4" /> CSV to JSON
                                </Link>
                            </li>
                            <li>
                                <Link href="/xml-to-excel" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon format="xml" className="w-4 h-4" /> XML to Excel
                                </Link>
                            </li>
                            <li>
                                <Link href="/xml-to-json" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon format="xml" className="w-4 h-4" /> XML to JSON
                                </Link>
                            </li>
                            <li>
                                <Link href="/csv-to-excel" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon format="csv" className="w-4 h-4" /> CSV to Excel
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Popular SaaS Integrations */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-foreground tracking-tight">Popular Presets</h3>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>
                                <Link href="/converters/stripe-json-to-excel" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon platform="stripe" className="w-4 h-4" /> Stripe to Excel
                                </Link>
                            </li>
                            <li>
                                <Link href="/converters/shopify-json-to-csv" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon platform="shopify" className="w-4 h-4" /> Shopify to CSV
                                </Link>
                            </li>
                            <li>
                                <Link href="/converters/salesforce-json-to-excel" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon platform="salesforce" className="w-4 h-4" /> Salesforce to Excel
                                </Link>
                            </li>
                            <li>
                                <Link href="/converters/hubspot-json-to-excel" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon platform="hubspot" className="w-4 h-4" /> HubSpot to Excel
                                </Link>
                            </li>
                            <li>
                                <Link href="/converters/jira-json-to-excel" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon platform="jira" className="w-4 h-4" /> Jira to Excel
                                </Link>
                            </li>
                            <li>
                                <Link href="/converters/quickbooks-json-to-excel" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <BrandIcon platform="quickbooks" className="w-4 h-4" /> QuickBooks to Excel
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources & Open Source */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-foreground tracking-tight">Resources &amp; Docs</h3>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>
                                <Link href="/converters" className="hover:text-primary transition-colors font-medium text-foreground">
                                    All Converters Directory
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="hover:text-primary transition-colors">
                                    Blog &amp; Guides
                                </Link>
                            </li>
                            <li>
                                <Link href="/recommended-tools" className="hover:text-primary transition-colors">
                                    Recommended Tools
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy-security" className="hover:text-primary transition-colors">
                                    Privacy &amp; Security
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/theGoodB0rg/json_hub"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                                >
                                    <Github className="w-3.5 h-3.5" /> GitHub Open Source
                                </a>
                            </li>
                            <li>
                                <LinkToUs />
                            </li>
                        </ul>
                        <div className="pt-2">
                            <SocialProofBadges />
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} JsonExport. Built for Data Analysts &amp; Engineers.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/privacy-security" className="hover:text-foreground transition-colors">Privacy Notice</Link>
                        <Link href="/security" className="hover:text-foreground transition-colors">Security Architecture</Link>
                        <Link href="/sitemap.xml" className="hover:text-foreground transition-colors">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
