import { Metadata } from 'next';
import { ConverterApp } from '@/components/ConverterApp';
import { Card } from '@/components/ui/card';
import { Shield, Lock, WifiOff, FileJson, Server, Check, X, Database } from 'lucide-react';
import { FAQSchema } from '@/components/FAQSchema';
import { SecurityBadges } from '@/components/SecurityBadges';

export const metadata: Metadata = {
    title: 'Secure JSON to Excel Converter | 100% Private, No Uploads, Offline',
    description: 'The only JSON converter that guarantees 100% privacy by running entirely in your browser. No server uploads, GDPR/HIPAA compliant by default, and works offline.',
    keywords: ['secure json to excel', 'private json converter', 'json to excel offline', 'gdpr compliant json converter', 'hipaa compliant data tool', 'client side json conversion'],
    alternates: {
        canonical: '/privacy-security',
    }
};

const faqs = [
    {
        question: "Does my JSON data ever leave my computer?",
        answer: "No. Never. JsonExport runs entirely in your web browser using JavaScript. Your data is processed locally on your device's memory and is never sent to any server, cloud, or third party."
    },
    {
        question: "How can I verify that you don't upload my files?",
        answer: "You can turn off your internet connection after loading the page. The converter will still work perfectly because it doesn't need a server. You can also inspect the 'Network' tab in your browser's developer tools to see zero export requests."
    },
    {
        question: "Is this tool GDPR and HIPAA compliant?",
        answer: "Yes. Because we never collect, store, or transmit your data, we are automatically compliant. We act as a 'local tool' (like Excel installed on your computer) rather than a data processor."
    },
    {
        question: "Why does client-side processing handle large files better?",
        answer: "Server-based tools have strict limits (usually 5MB-10MB) to save bandwidth and server costs. Since we use your computer's RAM, the only limit is your hardware. We routinely handle 500MB+ files that crash other tools."
    }
];

export default function PrivacyPage() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">100% Private</span>
                        <br />JSON Conversion
                    </h1>
                }
                subheading="Your data never leaves your device. No uploads. No servers. No risk."
            />

            <div className="container mx-auto px-4 py-16 max-w-5xl">

                {/* Security Badges */}
                <div className="mb-16">
                    <SecurityBadges />
                </div>

                {/* The Architecture Difference */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6 text-center">The Architecture of Privacy</h2>
                    <p className="text-lg text-muted-foreground mb-10 text-center max-w-2xl mx-auto">
                        Most online converters are "store-and-forward". We are "local-first".
                        Here is the technical difference that guarantees your security.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Competitors */}
                        <Card className="p-8 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 opacity-90">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-700 dark:text-red-400">
                                <Server className="w-6 h-6" />
                                Other Converters
                            </h3>

                            <div className="space-y-6 relative">
                                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-red-200 dark:bg-red-900" />

                                <div className="relative pl-10">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-xs font-bold text-red-600">1</div>
                                    <h4 className="font-semibold text-red-900 dark:text-red-300">Upload</h4>
                                    <p className="text-sm text-red-800/80 dark:text-red-400/80">You send your sensitive JSON to their unknown server.</p>
                                </div>
                                <div className="relative pl-10">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-xs font-bold text-red-600">2</div>
                                    <h4 className="font-semibold text-red-900 dark:text-red-300">Processing (Black Box)</h4>
                                    <p className="text-sm text-red-800/80 dark:text-red-400/80">Their server reads your data. Logs might be kept. Copies might be made.</p>
                                </div>
                                <div className="relative pl-10">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-xs font-bold text-red-600">3</div>
                                    <h4 className="font-semibold text-red-900 dark:text-red-300">Download</h4>
                                    <p className="text-sm text-red-800/80 dark:text-red-400/80">You get the file back, hoping they deleted the original.</p>
                                </div>
                            </div>
                        </Card>

                        {/* Us */}
                        <Card className="p-8 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                <Shield className="w-6 h-6" />
                                JsonExport (Our Approach)
                            </h3>

                            <div className="space-y-6 relative">
                                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-emerald-200 dark:bg-emerald-900" />

                                <div className="relative pl-10">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-600">1</div>
                                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">Load Locally</h4>
                                    <p className="text-sm text-emerald-800/80 dark:text-emerald-400/80">Your browser opens the file. No network request is made.</p>
                                </div>
                                <div className="relative pl-10">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-600">2</div>
                                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">Process in Memory</h4>
                                    <p className="text-sm text-emerald-800/80 dark:text-emerald-400/80">Our JavaScript code runs on YOUR CPU. Data stays in your RAM.</p>
                                </div>
                                <div className="relative pl-10">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-600">3</div>
                                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">Instant Export</h4>
                                    <p className="text-sm text-emerald-800/80 dark:text-emerald-400/80">The Excel file is generated right on your machine.</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Benefits Grid */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-8 text-center">Why Privacy = Better Performance</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="p-6">
                            <Database className="w-10 h-10 text-blue-500 mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Unlimited File Size</h3>
                            <p className="text-muted-foreground text-sm">
                                Since we don't pay for server storage, we don't cap your file size. Convert 500MB+ JSON files legally and for free.
                            </p>
                        </Card>
                        <Card className="p-6">
                            <WifiOff className="w-10 h-10 text-purple-500 mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Works Offline</h3>
                            <p className="text-muted-foreground text-sm">
                                Airplane mode? No problem. JsonExport is a PWA (Progressive Web App) that works without internet.
                            </p>
                        </Card>
                        <Card className="p-6">
                            <Lock className="w-10 h-10 text-orange-500 mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Corporate Safe</h3>
                            <p className="text-muted-foreground text-sm">
                                Safe for use with internal company data, PII, and sensitive financial records. No NDA needed.
                            </p>
                        </Card>
                    </div>
                </section>

                {/* PWA / Install Link */}
                <section className="mb-16 bg-muted/30 rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Install as an App</h2>
                    <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                        For the ultimate privacy experience, install JsonExport to your desktop or phone. It opens in its own window and works offline instantly.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-background border rounded-lg text-sm font-medium">
                        Look for the <span className="p-1 border rounded bg-muted"><sup className="text-[10px]">⊕</sup> Install</span> icon in your browser address bar
                    </div>
                </section>

                {/* FAQ Section */}
                <section>
                    <h2 className="text-3xl font-bold mb-6">Security FAQs</h2>
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
