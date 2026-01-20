import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'JsonExport - Free JSON to Excel Converter'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    // Font
    const interSemiBold = await fetch(
        'https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-SemiBold.ttf'
    ).then((res) => res.arrayBuffer())

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
                    backgroundColor: '#0f172a',
                    backgroundImage: 'linear-gradient(to bottom right, #020617, #1e293b, #0f172a)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Icon */}
                    <svg
                        width="120"
                        height="120"
                        viewBox="0 0 40 40"
                        fill="none"
                        style={{ marginRight: 40 }}
                    >
                        <rect x="0" y="0" width="40" height="40" rx="8" fill="#2563eb" />
                        <path d="M12 20 L20 12 L20 17 L28 17 L28 23 L20 23 L20 28 Z" fill="white" />
                        <path d="M10 10 C 5 10, 5 20, 5 20 C 5 20, 5 30, 10 30" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
                        <path d="M30 10 C 35 10, 35 20, 35 20 C 35 20, 35 30, 30 30" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
                    </svg>
                    <div
                        style={{
                            color: 'white',
                            fontSize: 100,
                            fontFamily: 'Inter',
                            fontWeight: 600,
                            letterSpacing: '-0.05em',
                            lineHeight: 1,
                        }}
                    >
                        JsonExport
                    </div>
                </div>
                <div
                    style={{
                        color: '#94a3b8',
                        fontSize: 42,
                        fontFamily: 'Inter',
                        marginTop: 40,
                        letterSpacing: '-0.025em',
                    }}
                >
                    The Smart JSON Strategy
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Inter',
                    data: interSemiBold,
                    style: 'normal',
                    weight: 600,
                },
            ],
        }
    )
}
