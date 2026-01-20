import { Metadata } from 'next';
import { ConverterApp } from '@/components/ConverterApp';
import { Card } from '@/components/ui/card';
import { Check, X, Zap, Code, GraduationCap, Clock, Shield } from 'lucide-react';
import { FAQSchema } from '@/components/FAQSchema';

export const metadata: Metadata = {
    title: 'Power Query Alternative for JSON to Excel (No Coding Required) - JsonExport',
    description: 'Looking for an easier alternative to Power Query for JSON to Excel conversion? JsonExport handles nested JSON without M language. Free, fast, no learning curve.',
    keywords: ['power query alternative', 'json to excel without power query', 'power query alternative free', 'easier than power query', 'no-code json converter'],
    alternates: {
        canonical: '/alternatives/power-query',
    }
};

const faqs = [
    {
        question: "Is JsonExport really easier than Power Query?",
        answer: "Yes. Power Query requires learning M language and manually expanding each nested level. JsonExport automatically flattens nested JSON with zero configuration - just drag, drop, and export."
    },
    {
        question: "When should I still use Power Query?",
        answer: "Use Power Query when you need: refreshable data connections to URLs, complex multi-step transformations, or integration with other Excel data sources. For one-time JSON conversions, JsonExport is faster."
    },
    {
        question: "Can JsonExport handle the same complex JSON as Power Query?",
        answer: "Yes. JsonExport handles deeply nested objects (5+ levels), arrays within arrays, and even double-encoded JSON strings - all automatically."
    },
    {
        question: "Is JsonExport free like Power Query?",
        answer: "Yes, JsonExport is 100% free to use with no signup required. Unlike some online converters, there's no file size paywall."
    }
];

export default function PowerQueryAlternativePage() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">Power Query Alternative</span>
                        <br />for JSON to Excel
                    </h1>
                }
                subheading="No M language. No manual expansion. Just drag, drop, and export."
            />

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                {/* Why Look for Alternatives */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">Why Data Analysts Look for Power Query Alternatives</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                        Power Query is powerful, but it has a steep learning curve. For simple JSON to Excel conversions,
                        many analysts find themselves spending 15-20 minutes fighting with M language when the task should take 30 seconds.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <X className="w-5 h-5 text-red-500" />
                                Power Query Pain Points
                            </h3>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>• M language is complex and unintuitive</li>
                                <li>• Manual &quot;expand&quot; clicks for each nested level</li>
                                <li>• Cryptic error messages when things break</li>
                                <li>• 10-15 minutes for moderately nested JSON</li>
                                <li>• Breaks when JSON structure changes</li>
                            </ul>
                        </Card>

                        <Card className="p-6 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                What You Actually Want
                            </h3>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>• Drag and drop simplicity</li>
                                <li>• Auto-flatten without configuration</li>
                                <li>• Instant preview of results</li>
                                <li>• 30-second conversion time</li>
                                <li>• Adapts to any JSON structure</li>
                            </ul>
                        </Card>
                    </div>
                </section>

                {/* Comparison Table */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">JsonExport vs Power Query: Feature Comparison</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b-2 border-border">
                                    <th className="text-left p-4 font-semibold">Feature</th>
                                    <th className="p-4 font-semibold text-center">JsonExport</th>
                                    <th className="p-4 font-semibold text-center">Power Query</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-border">
                                    <td className="p-4 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Time to Convert
                                    </td>
                                    <td className="p-4 text-center text-green-600 dark:text-green-400 font-medium">30 seconds</td>
                                    <td className="p-4 text-center text-muted-foreground">10-15 minutes</td>
                                </tr>
                                <tr className="border-b border-border bg-muted/30">
                                    <td className="p-4 flex items-center gap-2">
                                        <Code className="w-4 h-4" /> Coding Required
                                    </td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="p-4 text-center"><X className="w-5 h-5 mx-auto text-red-500" /></td>
                                </tr>
                                <tr className="border-b border-border">
                                    <td className="p-4 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" /> Learning Curve
                                    </td>
                                    <td className="p-4 text-center text-green-600 dark:text-green-400 font-medium">None</td>
                                    <td className="p-4 text-center text-muted-foreground">2-4 hours (M language)</td>
                                </tr>
                                <tr className="border-b border-border bg-muted/30">
                                    <td className="p-4 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> Handles Nested JSON
                                    </td>
                                    <td className="p-4 text-center text-green-600 dark:text-green-400 font-medium">Automatic</td>
                                    <td className="p-4 text-center text-muted-foreground">Manual clicks per level</td>
                                </tr>
                                <tr className="border-b border-border">
                                    <td className="p-4 flex items-center gap-2">
                                        <Shield className="w-4 h-4" /> Privacy
                                    </td>
                                    <td className="p-4 text-center text-green-600 dark:text-green-400 font-medium">100% Client-Side</td>
                                    <td className="p-4 text-center text-green-600 dark:text-green-400 font-medium">Local Processing</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* When to Use Each */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">When to Use Each Tool</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">✅ Use JsonExport When</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>You need a one-time conversion (not recurring)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>JSON structure is complex with deep nesting</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>You don&apos;t want to learn M language</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Speed is more important than automation</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-muted-foreground">Use Power Query When</h3>
                            <ul className="space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 flex-shrink-0 mt-0.5">→</span>
                                    <span>You need auto-refreshing data connections</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 flex-shrink-0 mt-0.5">→</span>
                                    <span>JSON is from a URL endpoint (not a file)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 flex-shrink-0 mt-0.5">→</span>
                                    <span>You&apos;re already a Power Query expert</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 flex-shrink-0 mt-0.5">→</span>
                                    <span>You need to combine multiple data sources</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section>
                    <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
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
