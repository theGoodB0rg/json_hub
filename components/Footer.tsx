import Link from 'next/link';
import { Github, Lock, Zap, FileJson, FileSpreadsheet, FileText } from 'lucide-react';

export function Footer() {
    return (
        <footer className="py-12 border-t border-border/40 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg tracking-tight">JsonExport</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            The privacy-first Data Analyst Workbench.
                            <br />
                            Visualize, clean, and export your data. 100% Local.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> Secure</div>
                            <div className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Fast</div>
                            <div className="flex items-center gap-1.5"><FileJson className="w-4 h-4" /> Private</div>
                        </div>
                    </div>

                    {/* Tools Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Tools</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <FileJson className="w-3.5 h-3.5" /> JSON to Excel
                                </Link>
                            </li>
                            <li>
                                <Link href="/json-to-csv" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> JSON to CSV
                                </Link>
                            </li>
                            <li>
                                <Link href="/json-to-excel" className="hover:text-primary transition-colors flex items-center gap-2">
                                    <FileSpreadsheet className="w-3.5 h-3.5" /> JSON to XLSX
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/blog" className="hover:text-primary transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/theGoodB0rg/json_hub"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    <Github className="w-3.5 h-3.5" /> GitHub
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-border/40 text-center text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} JsonExport. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
