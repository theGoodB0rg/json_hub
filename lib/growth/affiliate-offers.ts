export interface AffiliateOffer {
    title: string;
    description: string;
    cta: string;
    link: string;
}

function withGrowthParams(baseUrl: string, platform: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', 'jsonexport');
    url.searchParams.set('utm_medium', 'affiliate_toast');
    url.searchParams.set('utm_campaign', 'phase4_growth_execution');
    url.searchParams.set('utm_content', platform);
    return url.toString();
}

export const AFFILIATE_OFFERS: Record<string, AffiliateOffer> = {
    stripe: {
        title: "Stripe Metadata Cleaned! 💳",
        description: "Tired of dealing with raw Stripe JSON? Use Baremetrics to sync Stripe directly to your dashboard.",
        cta: "Try Baremetrics Free",
        link: withGrowthParams('https://baremetrics.com/', 'stripe'),
    },
    salesforce: {
        title: "Salesforce Export Fixed! ☁️",
        description: "Need an automated way to pull Salesforce API dumps into beautiful Excel reports?",
        cta: "Explore Coefficient",
        link: withGrowthParams('https://coefficient.io/', 'salesforce'),
    },
    hubspot: {
        title: "HubSpot Properties Flattened! 🟧",
        description: "Stop manually fixing HubSpot exports. Automate your CRM reporting instantly.",
        cta: "Get Supermetrics",
        link: withGrowthParams('https://supermetrics.com/', 'hubspot'),
    },
    shopify: {
        title: "Shopify Line Items Flattened! 🛍️",
        description: "Need to sync Shopify orders to Sheets or Notion without writing JSON scripts?",
        cta: "Try Zapier",
        link: withGrowthParams('https://zapier.com/', 'shopify'),
    },
    mongodb: {
        title: "MongoDB Documents Flattened! 🍃",
        description: "Analyze MongoDB data instantly. Looking for a native Mongo BI connector?",
        cta: "View MongoDB BI",
        link: withGrowthParams('https://www.mongodb.com/products/tools/bi-connector', 'mongodb'),
    },
    jira: {
        title: "Jira Custom Fields Extracted! 🎟️",
        description: "Stop fighting Jira's REST API. Use EasyBI to build custom Jira reports natively.",
        cta: "Try EasyBI",
        link: withGrowthParams('https://www.eazybi.com/', 'jira'),
    },
};

