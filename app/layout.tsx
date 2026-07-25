import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Footer } from "@/components/Footer"
import { ROUTES, SITE_ORIGIN } from '@/lib/routes'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap', // Ensure text remains visible during font load
    preload: true,
})

export const metadata: Metadata = {
    metadataBase: new URL(SITE_ORIGIN),
    other: {
        'impact-site-verification': 'fa5b3c9a-8603-4033-844b-f0528518efa6',
    },
    alternates: {
        canonical: ROUTES.home,
    },
    title: 'JSON to Excel Converter — Free, Private, No Upload | JsonExport',
    description: 'Convert JSON to Excel, CSV, or XLSX instantly. 100% free, no upload, no signup. Handles nested arrays, [object Object] errors, and 100MB+ files in your browser.',
    applicationName: 'JsonExport',
    authors: [{ name: 'JsonExport Team' }],
    keywords: ['json to excel', 'json to excel converter', 'convert json to xlsx', 'json to csv', 'data analyst tools', 'json converter for data analysts', 'no-code json converter', 'secure json converter', 'json to excel free', 'flatten nested json', 'json to excel no upload', 'json to excel offline'],
    creator: 'JsonExport',
    publisher: 'JsonExport',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
            { url: '/logo-512.png', sizes: '512x512', type: 'image/png' },
            { url: '/icon.svg', type: 'image/svg+xml' },
        ],
        shortcut: '/favicon.ico',
        apple: '/logo-512.png',
    },
    openGraph: {
        title: 'JSON to Excel Converter — Free, Private, No Upload | JsonExport',
        description: 'Convert JSON to Excel, CSV, or XLSX instantly — 100% free, no upload, no signup. Handles nested data and large files privately in your browser.',
        url: SITE_ORIGIN,
        siteName: 'JsonExport',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'JSON to Excel Converter — Free, Private, No Upload | JsonExport',
        description: 'Convert JSON to Excel, CSV, or XLSX instantly — free, private, no upload. Handles nested data and large files.',
        creator: '@jsonexport',
    },
    manifest: '/manifest.json',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Impact.com Site Verification Meta Tags */}
                <meta name="impact-site-verification" value="fa5b3c9a-8603-4033-844b-f0528518efa6" />
                <meta name="impact-site-verification" content="fa5b3c9a-8603-4033-844b-f0528518efa6" />

                {/* Performance: Preconnect to external origins */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
            </head>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TooltipProvider delayDuration={300}>
                        <AnalyticsProvider>
                            <div className="flex flex-col min-h-screen">
                                <div className="flex-1">
                                    {children}
                                </div>
                                <Footer />
                            </div>
                        </AnalyticsProvider>
                    </TooltipProvider>

                    {/* Schema.org Structured Data for SEO */}
                    <Script
                        id="schema-software"
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "SoftwareApplication",
                                "name": "JsonExport",
                                "applicationCategory": "DeveloperApplication",
                                "operatingSystem": "Any (Web-based)",
                                "offers": {
                                    "@type": "Offer",
                                    "price": "0",
                                    "priceCurrency": "USD"
                                },
                                "description": "Free JSON to Excel, CSV, and XLSX converter. 100% private client-side processing. Handles nested arrays, [object Object] errors, and 100MB+ files. No upload, no signup.",
                                "url": SITE_ORIGIN,
                                "aggregateRating": {
                                    "@type": "AggregateRating",
                                    "ratingValue": "4.9",
                                    "ratingCount": "142",
                                    "bestRating": "5",
                                    "worstRating": "1"
                                },
                                "featureList": [
                                    "Auto-unescape double-encoded JSON",
                                    "Smart flattening with dot notation",
                                    "Export to Excel, CSV, HTML",
                                    "100% client-side processing",
                                    "Monaco Editor integration",
                                    "Editable data grid"
                                ]
                            })
                        }}
                    />

                    {/* Organization Schema for Google Search Logo */}
                    <Script
                        id="schema-organization"
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "Organization",
                                "name": "JsonExport",
                                "url": SITE_ORIGIN,
                                "logo": `${SITE_ORIGIN}/logo-512.png`,
                                "sameAs": [
                                    "https://github.com/theGoodB0rg/json_hub"
                                ]
                            })
                        }}
                    />

                </ThemeProvider>
            </body>
        </html>
    )
}
