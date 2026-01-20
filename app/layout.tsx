import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Footer } from "@/components/Footer"

const inter = Inter({
    subsets: ['latin'],
    display: 'swap', // Ensure text remains visible during font load
    preload: true,
})

export const metadata: Metadata = {
    metadataBase: new URL('https://jsonexport.com'),
    alternates: {
        canonical: './',
    },
    title: 'JsonExport | Free JSON to Excel Converter for Data Analysts',
    description: 'Convert JSON to Excel instantly. 100% private (no upload), handles files up to 100MB, free to use with no signup. Ideal for data analysts who need quick, secure conversions without coding.',
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
        title: 'JsonExport | Free JSON to Excel Converter for Data Analysts',
        description: 'Convert JSON to Excel instantly. 100% private, handles large files, completely free. No coding required.',
        url: 'https://jsonexport.com',
        siteName: 'JsonExport',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'JsonExport | Free JSON to Excel Converter for Data Analysts',
        description: 'Convert JSON to Excel instantly. 100% private, no coding required. Free to use.',
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
                        <div className="flex flex-col min-h-screen">
                            <div className="flex-1">
                                {children}
                            </div>
                            <Footer />
                        </div>
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
                                "description": "Convert JSON to Excel, CSV, or HTML. 100% private, client-side processing. No coding required.",
                                "url": "https://jsonexport.com",
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
                                "url": "https://jsonexport.com",
                                "logo": "https://jsonexport.com/logo-512.png",
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
