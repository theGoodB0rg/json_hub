export interface AffiliatePartner {
    id: string;
    name: string;
    description: string;
    benefit: string;
    logoUrl: string; // We'll use lucide icons for now if no image
    affiliateUrl: string;
    bgColor: string;
    textColor: string;
}

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
    {
        id: 'zapier',
        name: 'Zapier',
        description: 'Automate your JSON API workflows instantly.',
        benefit: 'Sync to 5,000+ Apps',
        logoUrl: '/images/partners/zapier.svg',
        affiliateUrl: 'https://zapier.com/YOUR_IMPACT_ID', // Replaced Make.com with Impact.com/Payoneer compatible affiliate
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-600',
    },
    {
        id: 'notion',
        name: 'Notion',
        description: 'Turn converted JSON into a relational database.',
        benefit: 'Import to Smart Workspace',
        logoUrl: '/images/partners/notion.svg',
        affiliateUrl: 'https://notion.so/YOUR_IMPACT_ID', // Supported via Impact.com
        bgColor: 'bg-slate-500/10',
        textColor: 'text-slate-700 dark:text-slate-300',
    },
    {
        id: 'coupler',
        name: 'Coupler.io',
        description: 'Auto-sync live API endpoints to Sheets & Excel.',
        benefit: 'Automate Spreadsheet Sync',
        logoUrl: '/images/partners/coupler.svg',
        affiliateUrl: 'https://coupler.io/YOUR_IMPACT_ID', // Supported via Impact.com / Payoneer
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-600',
    }
];

