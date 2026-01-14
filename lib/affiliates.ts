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
        id: 'airtable',
        name: 'Airtable',
        description: 'Turn this JSON into a real database.',
        benefit: 'Import directly to Relational DB',
        logoUrl: '/images/partners/airtable.svg',
        affiliateUrl: 'https://airtable.com/invite/r/YOUR_ID', // User to replace
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-600',
    },
    {
        id: 'monday',
        name: 'Monday.com',
        description: 'Visualize this data securely.',
        benefit: 'Create Dashboards Instantly',
        logoUrl: '/images/partners/monday.svg',
        affiliateUrl: 'https://monday.com/ref/YOUR_ID', // User to replace
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600',
    },
    {
        id: 'make',
        name: 'Make.com',
        description: 'Automate this workflow.',
        benefit: 'Skip manual uploads',
        logoUrl: '/images/partners/make.svg',
        affiliateUrl: 'https://make.com/en/hq/YOUR_ID', // User to replace
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-600',
    }
];
