import { Metadata } from 'next';
import { ConverterApp } from '@/components/ConverterApp';
import { Card } from '@/components/ui/card';
import { Check, X, Terminal, MousePointer, Clock, FileText, Users } from 'lucide-react';
import { FAQSchema } from '@/components/FAQSchema';

export const metadata: Metadata = {
    title: 'Convert JSON to Excel Without Python (Zero Coding Required) - JsonExport',
    description: 'No Python? No problem. Convert JSON to Excel instantly without writing code. JsonExport handles nested JSON, large files, and complex structures - all in your browser.',
    keywords: ['json to excel without python', 'json to excel no code', 'json to excel without coding', 'python alternative json excel', 'no-code json converter'],
    alternates: {
        canonical: '/alternatives/python-pandas',
    }
};

const faqs = [
    {
        question: "Why would I use JsonExport instead of Python?",
        answer: "If you need a quick one-time conversion and don't know Python, JsonExport saves you hours of setup time. Just drag, drop, and export - no installation, no debugging, no code."
    },
    {
        question: "Can JsonExport handle as much as Python Pandas?",
        answer: "For 90% of use cases (files up to 50MB, nested structures), yes. Python excels with 100MB+ files or when you need custom transformations not available in UI tools."
    },
    {
        question: "I already know Python. Should I use JsonExport?",
        answer: "For quick one-offs, yes. Writing a Python script for a single conversion takes 5-10 minutes. JsonExport takes 30 seconds. Save Python for automation and complex pipelines."
    },
    {
        question: "Is the output quality the same as pd.json_normalize()?",
        answer: "Yes. JsonExport uses the same flattening approach - dot notation for nested objects (e.g., customer.name). The Excel output is identical to what you'd get from Pandas."
    }
];

export default function PythonAlternativePage() {
    return (
        <>
            <ConverterApp
                heading={
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
                        JSON to Excel<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-400 dark:to-orange-400">Without Python</span>
                    </h1>
                }
                subheading="No pip install. No imports. No debugging. Just results."
            />

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                {/* The Problem */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">The Python Setup Problem</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                        You just need to convert one JSON file to Excel. But the &quot;simple&quot; Python solution requires:
                    </p>

                    <Card className="p-6 mb-8 bg-muted/30 font-mono text-sm overflow-x-auto">
                        <pre className="text-muted-foreground">
                            {`# Step 1: Install Python (10 minutes)
# Step 2: Install pip packages
pip install pandas openpyxl

# Step 3: Write the script (5 minutes)
import pandas as pd
import json

with open('data.json', 'r') as f:
    data = json.load(f)

df = pd.json_normalize(data['records'])
df.to_excel('output.xlsx', index=False)

# Step 4: Debug why it's not working (15 minutes)
# "KeyError: 'records'" 
# "ModuleNotFoundError: No module named 'openpyxl'"
# "TypeError: argument of type 'NoneType' is not iterable"`}
                        </pre>
                    </Card>

                    <p className="text-lg text-muted-foreground">
                        <strong>Total time: 30-45 minutes.</strong> For something that should take 30 seconds.
                    </p>
                </section>

                {/* Comparison */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">Python vs JsonExport: Side by Side</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Terminal className="w-6 h-6 text-yellow-500" />
                                <h3 className="font-semibold text-lg">Python + Pandas</h3>
                            </div>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">1.</span>
                                    Install Python runtime
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">2.</span>
                                    pip install pandas openpyxl
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">3.</span>
                                    Write Python script
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">4.</span>
                                    Handle nested JSON structure
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">5.</span>
                                    Debug errors
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">6.</span>
                                    Run script
                                </li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-sm"><strong>Time:</strong> 30-45 minutes (first time)</p>
                                <p className="text-sm"><strong>Skill:</strong> Python programming required</p>
                            </div>
                        </Card>

                        <Card className="p-6 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                            <div className="flex items-center gap-2 mb-4">
                                <MousePointer className="w-6 h-6 text-green-500" />
                                <h3 className="font-semibold text-lg">JsonExport</h3>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    Drag and drop JSON file
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    Click &quot;Download Excel&quot;
                                </li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                                <p className="text-sm"><strong>Time:</strong> 30 seconds</p>
                                <p className="text-sm"><strong>Skill:</strong> None required</p>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* When to Use Each */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">When to Use Each Tool</h2>

                    <div className="space-y-6">
                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <MousePointer className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Use JsonExport (90% of cases)</h3>
                                    <ul className="space-y-1 text-muted-foreground">
                                        <li>• One-time conversions</li>
                                        <li>• Files up to 50MB</li>
                                        <li>• When you need results now, not in 30 minutes</li>
                                        <li>• When you&apos;re not a developer</li>
                                        <li>• When privacy matters (client-side processing)</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                                    <Terminal className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Use Python + Pandas</h3>
                                    <ul className="space-y-1 text-muted-foreground">
                                        <li>• Files over 100MB</li>
                                        <li>• Automated pipelines (daily/weekly scripts)</li>
                                        <li>• Complex transformations beyond simple flattening</li>
                                        <li>• Integration with existing Python codebases</li>
                                        <li>• When you&apos;re already a Python developer</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Who Uses JsonExport */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">Who Chooses JsonExport Over Python?</h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="p-6 text-center">
                            <Users className="w-8 h-8 mx-auto mb-4 text-blue-500" />
                            <h3 className="font-semibold mb-2">Business Analysts</h3>
                            <p className="text-sm text-muted-foreground">
                                &quot;I don&apos;t have time to learn Python for a single report.&quot;
                            </p>
                        </Card>
                        <Card className="p-6 text-center">
                            <FileText className="w-8 h-8 mx-auto mb-4 text-purple-500" />
                            <h3 className="font-semibold mb-2">Marketing Teams</h3>
                            <p className="text-sm text-muted-foreground">
                                &quot;I just need to analyze this HubSpot export. Now.&quot;
                            </p>
                        </Card>
                        <Card className="p-6 text-center">
                            <Clock className="w-8 h-8 mx-auto mb-4 text-orange-500" />
                            <h3 className="font-semibold mb-2">Busy Developers</h3>
                            <p className="text-sm text-muted-foreground">
                                &quot;I know Python, but writing a script for one file isn&apos;t worth it.&quot;
                            </p>
                        </Card>
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
