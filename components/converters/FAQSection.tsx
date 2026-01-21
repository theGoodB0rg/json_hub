
import { ConverterPageConfig } from "@/lib/platform-data";
import { Card } from "@/components/ui/card";

interface Props {
    pageConfig: ConverterPageConfig;
}

export function FAQSection({ pageConfig }: Props) {
    return (
        <section className="mb-16">
            <h3 className="text-2xl font-bold mb-6">Specific Questions</h3>
            <div className="space-y-4">
                {pageConfig.faqs.map((faq, i) => (
                    <Card key={i} className="p-6">
                        <h4 className="font-semibold text-lg mb-2">{faq.question}</h4>
                        <p className="text-muted-foreground">{faq.answer}</p>
                    </Card>
                ))}
            </div>
        </section>
    );
}
