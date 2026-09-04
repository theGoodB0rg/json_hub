import { ConverterPageConfig } from "./platform-data";
import { SITE_ORIGIN, toAbsoluteUrl } from '@/lib/routes';

export function generateSoftwareApplicationSchema(pageConfig: ConverterPageConfig) {
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": pageConfig.title,
        "operatingSystem": "All (Web Browser, Windows, macOS, Linux)",
        "applicationCategory": "DeveloperApplication",
        "inputFormat": "application/json",
        "outputFormat": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "priceValidUntil": "2027-12-31",
            "availability": "https://schema.org/InStock"
        },
        "description": pageConfig.description,
        "featureList": [
            "1-Click Auto-Flattening",
            "Fixes [object Object] Errors",
            "Nested Array Unwinding",
            ...pageConfig.content.features
        ].join(", ")
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

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_ORIGIN
            },
            ...items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 2, // Start at 2 since Home is 1
                "name": item.name,
                "item": toAbsoluteUrl(item.item)
            }))
        ]
    };
}
