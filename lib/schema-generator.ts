
import { ConverterPageConfig } from "./platform-data";

export function generateSoftwareApplicationSchema(pageConfig: ConverterPageConfig) {
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": pageConfig.title,
        "operator": {
            "@type": "Organization",
            "name": "JsonExport",
            "url": "https://jsonexport.com"
        },
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "priceValidUntil": "2026-12-31"
        },
        "description": pageConfig.description,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250"
        },
        "featureList": pageConfig.content.features.join(", ")
    };
}

export function generateHowToSchema(pageConfig: ConverterPageConfig) {
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": `How to Convert ${pageConfig.platformName} JSON to Excel`,
        "step": [
            {
                "@type": "HowToStep",
                "name": "Get your JSON Data",
                "text": `Export or copy the JSON data from your ${pageConfig.platformName} account.`
            },
            {
                "@type": "HowToStep",
                "name": "Paste into Converter",
                "text": "Paste the JSON text into the input box on JsonExport."
            },
            {
                "@type": "HowToStep",
                "name": "Download Excel",
                "text": "Click the 'Convert' button and download your formatted Excel file."
            }
        ]
    };
}
