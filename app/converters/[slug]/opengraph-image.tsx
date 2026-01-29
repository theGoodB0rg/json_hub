import { ImageResponse } from 'next/og';
import { getPlatformIcon, ICONS, OG_SIZE } from '@/lib/og-utils';
import { converterPages } from '@/lib/platform-data';

export const size = OG_SIZE;
export const contentType = 'image/png';

export async function generateStaticParams() {
    return converterPages.map((page) => ({
        slug: page.slug,
    }));
}

interface Props {
    params: {
        slug: string;
    };
}

export default async function Image({ params }: Props) {
    // Font
    const fontData = await fetch(new URL('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-700-normal.woff', import.meta.url)).then((res) => res.arrayBuffer());

    // Find the converter data based on the slug
    const converter = converterPages.find(p => p.slug === params.slug);
    const platformName = converter?.platformName || 'JSON';
    const title = converter?.h1 || 'JSON to Excel Converter';

    // Get the specific platform icon for the left side
    const leftIcon = getPlatformIcon(platformName);

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F8FAFC',
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #e2e8f0 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e2e8f0 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Flow Diagram */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '60px',
                        marginBottom: '50px',
                    }}
                >
                    {/* Source Platform */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        {leftIcon}
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#334155' }}>
                            {platformName}
                        </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', paddingBottom: '30px' }}>
                        {ICONS.arrow}
                    </div>

                    {/* Target Excel */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        {ICONS.excel}
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#107C41' }}>Excel</div>
                    </div>
                </div>

                {/* Title */}
                <h1
                    style={{
                        fontSize: 72,
                        fontWeight: 900,
                        color: '#0f172a',
                        margin: '0 0 20px 0',
                        letterSpacing: '-0.03em',
                        textAlign: 'center',
                        lineHeight: 1.1,
                        maxWidth: '90%',
                    }}
                >
                    {title}
                </h1>

                {/* Trust Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 24px',
                        background: '#fff',
                        borderRadius: '50px',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {ICONS.shield}
                    <span style={{ fontSize: 24, color: '#475569', fontWeight: 600 }}>
                        No Code. 100% Private.
                    </span>
                </div>

                {/* Brand Footer */}
                <div style={{ position: 'absolute', bottom: 40, fontSize: 20, color: '#94a3b8', fontWeight: 500 }}>
                    jsonexport.com
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Inter',
                    data: fontData,
                    style: 'normal',
                    weight: 700,
                },
            ],
        }
    );
}
