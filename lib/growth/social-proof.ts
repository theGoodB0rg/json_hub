export interface SocialProofChannel {
    id: 'product_hunt' | 'g2' | 'capterra';
    label: string;
    href: string | null;
    status: 'planned' | 'live';
}

const PRODUCT_HUNT_URL = process.env.NEXT_PUBLIC_PRODUCT_HUNT_URL?.trim() || '';
const G2_URL = process.env.NEXT_PUBLIC_G2_URL?.trim() || '';
const CAPTERRA_URL = process.env.NEXT_PUBLIC_CAPTERRA_URL?.trim() || '';

export function getSocialProofChannels(): SocialProofChannel[] {
    return [
        {
            id: 'product_hunt',
            label: 'Product Hunt',
            href: PRODUCT_HUNT_URL || null,
            status: PRODUCT_HUNT_URL ? 'live' : 'planned',
        },
        {
            id: 'g2',
            label: 'G2',
            href: G2_URL || null,
            status: G2_URL ? 'live' : 'planned',
        },
        {
            id: 'capterra',
            label: 'Capterra',
            href: CAPTERRA_URL || null,
            status: CAPTERRA_URL ? 'live' : 'planned',
        },
    ];
}

