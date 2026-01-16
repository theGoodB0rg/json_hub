import { Metadata } from 'next';
import { ConverterApp } from '@/components/ConverterApp';
import { Card } from '@/components/ui/card';
import { Shield, Lock, Server, Monitor, Check, X, Eye, Database, FileCheck } from 'lucide-react';
import { FAQSchema } from '@/components/FAQSchema';

export const metadata: Metadata = {
    title: 'Secure JSON to Excel Converter (100% Client-Side, No Upload) - JsonExport',
    description: 'The most secure JSON to Excel converter. Your data never leaves your browser. No server uploads, GDPR/HIPAA compliant, perfect for sensitive financial and healthcare data.',
    keywords: ['json to excel secure', 'json to excel offline', 'json to excel no upload', 'secure json converter', 'private json to excel', 'HIPAA compliant json converter'],
    alternates: {
        canonical: '/security',
    }
};

const faqs = [
    {
        question: "How does client-side processing work?",
        answer: "Your JSON file is processed entirely in your browser using JavaScript. The data is read, transformed, and exported locally on your computer. No data is ever transmitted to any server."
    },
    {
        question: "Is JsonExport HIPAA compliant?",
        answer: "Yes. Since no data is transmitted or stored on our servers, there's no Protected Health Information (PHI) handling to regulate. Your healthcare data stays on your computer."
    },
    {
        question: "Can I use JsonExport offline?",
        answer: "Once the page is loaded, you can disconnect from the internet and continue using JsonExport. All processing happens locally in your browser."
    },
    {
        question: "Why do other converters upload my data?",
        answer: "Most online converters use server-side processing because it's easier to implement. They upload your file, process it on their servers, and send back the result. This is faster to build but creates privacy risks."
    },
    {
        question: "What happens to my data after conversion?",
        answer: "Nothing. Your data is processed in browser memory and discarded when you close the tab. We have no servers storing your data because we never receive it in the first place."
    }
];

export default function SecurityPage() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">100% Secure</span>
                        <br />JSON Conversion
                    </h1>
                }
                subheading="Your data never leaves your browser. Period."
            />

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                {/* The Privacy Problem */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">The Hidden Risk of Online Converters</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                        Most &quot;free&quot; JSON converters upload your files to their servers. Your data passes through
                        unknown infrastructure, potentially stored indefinitely, and you have no idea who has access.
                    </p>

                    <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 mb-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <X className="w-5 h-5 text-red-500" />
                            What Happens with Upload-Based Converters
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full text-sm">
                                <Server className="w-4 h-4" /> Your File → Their Server
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full text-sm">
                                <Database className="w-4 h-4" /> Stored in Unknown Database
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full text-sm">
                                <Eye className="w-4 h-4" /> Potentially Accessed by Third Parties
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            How JsonExport Works (Client-Side)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full text-sm">
                                <Monitor className="w-4 h-4" /> Your File → Your Browser Only
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full text-sm">
                                <Lock className="w-4 h-4" /> No Server Communication
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full text-sm">
                                <FileCheck className="w-4 h-4" /> Discarded When Tab Closes
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Trust Badges */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6 text-center">Security Guarantees</h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="font-semibold mb-2">No Data Upload</h3>
                            <p className="text-sm text-muted-foreground">
                                Your files are never sent to any server
                            </p>
                        </Card>

                        <Card className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Monitor className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-semibold mb-2">100% Client-Side</h3>
                            <p className="text-sm text-muted-foreground">
                                All processing happens in your browser
                            </p>
                        </Card>

                        <Card className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-semibold mb-2">GDPR/HIPAA Ready</h3>
                            <p className="text-sm text-muted-foreground">
                                No PHI or PII ever transmitted
                            </p>
                        </Card>

                        <Card className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <FileCheck className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="font-semibold mb-2">Open Source</h3>
                            <p className="text-sm text-muted-foreground">
                                Verify our claims in the source code
                            </p>
                        </Card>
                    </div>
                </section>

                {/* Comparison */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">Security Comparison</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b-2 border-border">
                                    <th className="text-left p-4 font-semibold">Security Feature</th>
                                    <th className="p-4 font-semibold text-center">JsonExport</th>
                                    <th className="p-4 font-semibold text-center">Upload-Based Tools</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-border">
                                    <td className="p-4">Data stays on your computer</td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="p-4 text-center"><X className="w-5 h-5 mx-auto text-red-500" /></td>
                                </tr>
                                <tr className="border-b border-border bg-muted/30">
                                    <td className="p-4">Works offline</td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="p-4 text-center"><X className="w-5 h-5 mx-auto text-red-500" /></td>
                                </tr>
                                <tr className="border-b border-border">
                                    <td className="p-4">No third-party data access</td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="p-4 text-center"><X className="w-5 h-5 mx-auto text-red-500" /></td>
                                </tr>
                                <tr className="border-b border-border bg-muted/30">
                                    <td className="p-4">Safe for financial data</td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="p-4 text-center"><X className="w-5 h-5 mx-auto text-red-500" /></td>
                                </tr>
                                <tr className="border-b border-border">
                                    <td className="p-4">Safe for healthcare data (PHI)</td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="p-4 text-center"><X className="w-5 h-5 mx-auto text-red-500" /></td>
                                </tr>
                                <tr className="border-b border-border bg-muted/30">
                                    <td className="p-4">Enterprise-ready</td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="p-4 text-center text-muted-foreground">Depends on vendor</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Who Needs This */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">Who Needs Secure JSON Conversion?</h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-500" />
                                Healthcare Teams
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Patient records, lab results, and medical billing data must stay private.
                                HIPAA violations can cost millions.
                            </p>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Database className="w-5 h-5 text-green-500" />
                                Finance & Banking
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Transaction data, account information, and financial reports contain
                                sensitive customer data.
                            </p>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-purple-500" />
                                Enterprise IT
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Internal APIs, user databases, and system logs often contain
                                proprietary business intelligence.
                            </p>
                        </Card>
                    </div>
                </section>

                {/* FAQ Section */}
                <section>
                    <h2 className="text-3xl font-bold mb-6">Security FAQ</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <Card key={i} className="p-6">
                                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                                <p className="text-muted-foreground">{faq.answer}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* FAQ Schema */}
                <FAQSchema faqs={faqs} />
            </div>
        </>
    );
}
