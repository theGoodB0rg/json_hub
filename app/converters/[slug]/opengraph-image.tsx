import { ImageResponse } from 'next/og'
import { converterPages } from '@/lib/platform-data'

export const runtime = 'edge'

export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

interface Props {
    params: {
        slug: string
    }
}

// Map of platform names to their SVG paths (simplified for OG)
const ICON_PATHS: Record<string, string> = {
    stripe: "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.915 0-1.178 1.108-1.72 2.727-1.72 2.062 0 4.103.743 4.103.743l.568-2.585s-1.886-.774-4.577-.774c-4.137 0-6.19 1.952-6.19 5.38 0 4.298 5.732 4.608 5.732 7.026 0 1.255-1.405 1.89-3.372 1.89-2.71 0-5.145-1.037-5.145-1.037l-.647 2.74s2.217.82 4.972.82c4.326 0 6.648-2.014 6.648-5.38 0-4.639-5.463-4.996-5.463-7.187 0-1.022 1.12-1.611 2.82-1.611 1.703 0 2.946.542 2.946.542l.535 2.528s-1.04.604-2.3 1.05z",
    shopify: "M21.92 6.62a1 1 0 0 0-.54-.54A17 17 0 0 0 12.33 5a18.64 18.64 0 0 0-4.62.66l-.16.05-.14-1.62a1 1 0 0 0-1.11-.9L3 3.44a1 1 0 0 0-.9 1.11l2 25.13A1 1 0 0 0 5 30h14a1 1 0 0 0 1-.92L22 7.62a1 1 0 0 0-.08-1zM12 20a4 4 0 1 1 4-4 4 4 0 0 1-4 4z",
    jira: "M11.53 2C6.45 2 2.33 6.12 2.33 11.2c0 5.08 4.12 9.2 9.2 9.2h9.13v-9.2C20.66 6.12 16.54 2 11.53 2zM11.53 17.13c-3.28 0-5.93-2.65-5.93-5.93s2.65-5.93 5.93-5.93 5.93 2.65 5.93 5.93-2.65 5.93-5.93 5.93z",
    trello: "M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15ZM9.5 5h-4a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-8A.5.5 0 0 0 9.5 5Zm9 0h-4a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5Z",
    youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    slack: "M6 15a2.5 2.5 0 1 1-2.5-2.5H6v2.5zm1.5 0a2.5 2.5 0 1 1 2.5 2.5H8.5V15zm0-4V8.5a2.5 2.5 0 1 1 2.5 2.5H7.5zM15 6a2.5 2.5 0 1 1 2.5 2.5H15V6zm-1.5 0a2.5 2.5 0 1 1-2.5-2.5H13.5V6zm0 4V8.5a2.5 2.5 0 1 1-2.5-2.5H13.5zM18 15a2.5 2.5 0 1 1 2.5 2.5H18v-2.5zm-1.5 0a2.5 2.5 0 1 1-2.5-2.5H16.5V15zm0 4v2.5a2.5 2.5 0 1 1-2.5-2.5H16.5zM9 18a2.5 2.5 0 1 1-2.5-2.5H9V18zm1.5 0a2.5 2.5 0 1 1 2.5-2.5H10.5V18zm0-4v-2.5a2.5 2.5 0 1 1 2.5 2.5H10.5z",
    discord: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-2.313-9.117-3.953-11.758a.075.075 0 0 0-.032-.027z",
    mongodb: "M12.0003 2.5C14.4703 6.73 15.6903 11.67 15.6903 13.73C15.6903 15.5 15.1403 15.87 14.4903 15.87C13.9503 15.87 13.4003 15.55 13.1903 15.4L13.2203 14.72C13.5003 11.91 14.3003 6.49 12.0003 2.5Z",
    postgresql: "M12.0003 0C5.37286 0 0.00025177 5.37257 0.00025177 12C0.00025177 18.6274 5.37286 24 12.0003 24C18.6277 24 24.0003 18.6274 24.0003 12C24.0003 5.37257 18.6277 0 12.0003 0ZM17.1431 16.2858H15.0003V12.0001H17.1431V16.2858ZM12.8574 16.2858H10.7145V8.57149H12.8574V16.2858ZM8.57168 16.2858H6.42882V12.0001H8.57168V16.2858Z",
    notion: "M15.4544 18.8953L9.27788 7.39868L6.84589 7.78864V16.8228L8.71186 17.1328V9.1687L14.4984 19.9882L17.1513 19.5633V8.40866L15.3045 8.0987V17.0628L15.4544 18.8953ZM4.22925 4.19531L6.65719 4.66031C8.05925 4.66031 7.21447 3.59537 17.9392 4.22749L17.2647 5.58046L19.3179 19.2608C19.4828 20.3958 19.7378 20.3008 19.5428 21.1627C19.4633 21.5147 19.1668 21.751 18.8318 21.722L6.15175 19.6641C5.64184 19.5816 5.25338 19.1578 5.22938 18.6404L4.00428 5.20525C3.96678 4.79278 4.22925 4.19531 4.22925 4.19531Z"
}

// Brand color mapping
const BRAND_COLORS: Record<string, string> = {
    stripe: '#635BFF',
    shopify: '#95BF47',
    jira: '#0052CC',
    trello: '#0079BF',
    youtube: '#FF0000',
    slack: '#36C5F0',
    discord: '#5865F2',
    mongodb: '#116149',
    postgresql: '#336791',
    notion: '#000000',
}

export default async function Image({ params }: Props) {
    const pageConfig = converterPages.find((p) => p.slug === params.slug)
    const platformName = pageConfig ? pageConfig.platformName : 'JsonExport'
    const platformKey = platformName.toLowerCase()

    // Fallback if not found
    const iconPath = ICON_PATHS[platformKey] || ICON_PATHS['stripe'] // Default fallback
    const brandColor = BRAND_COLORS[platformKey] || '#2563eb'

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
                    backgroundColor: '#020617',
                    backgroundImage: 'linear-gradient(to bottom right, #020617, #1e293b, #0f172a)',
                    fontFamily: 'Inter',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
                    {/* Icon Circle */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 180,
                            height: 180,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: `4px solid ${brandColor}`,
                            boxShadow: `0 0 60px ${brandColor}40`,
                        }}
                    >
                        <svg
                            width="100"
                            height="100"
                            viewBox="0 0 24 24"
                            fill={brandColor}
                            style={{ opacity: 1 }}
                        >
                            <path d={iconPath} />
                        </svg>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                            style={{
                                color: 'white',
                                fontSize: 80,
                                fontWeight: 600,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        >
                            {pageConfig?.h1 || 'JSON to Excel'}
                        </div>
                        <div
                            style={{
                                color: '#94a3b8',
                                fontSize: 40,
                                fontWeight: 500,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Free, Secure & Private Converter
                        </div>
                    </div>
                </div>

                {/* Footer branding */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        opacity: 0.6,
                    }}
                >
                    <div style={{ fontSize: 24, color: '#e2e8f0' }}>jsonexport.com</div>
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
