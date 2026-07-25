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
        id: 'coupler',
        name: 'Coupler.io',
        description: 'Auto-sync live API endpoints directly to Sheets & Excel.',
        benefit: 'Automate Spreadsheet Sync',
        logoUrl: '/images/partners/coupler.svg',
        affiliateUrl: 'https://www.coupler.io/?ref=john70',
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-600',
    },
    {
        id: 'zapier',
        name: 'Zapier',
        description: 'Automate your JSON API workflows instantly.',
        benefit: 'Sync to 5,000+ Apps',
        logoUrl: '/images/partners/zapier.svg',
        affiliateUrl: 'https://zapier.com/',
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-600',
    },
    {
        id: 'notion',
        name: 'Notion',
        description: 'Turn converted JSON into a relational database.',
        benefit: 'Import to Smart Workspace',
        logoUrl: '/images/partners/notion.svg',
        affiliateUrl: 'https://notion.so/',
        bgColor: 'bg-slate-500/10',
        textColor: 'text-slate-700 dark:text-slate-300',
    }
];

