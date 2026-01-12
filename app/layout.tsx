import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'JsonExport | Convert JSON to Excel Free & Secure',
    description: 'JsonExport is the privacy-first tool to convert JSON files to Excel (XLSX) or CSV. Secure, fast, and free. No coding required. Perfect for business analysts.',
    applicationName: 'JsonExport',
    authors: [{ name: 'JsonExport Team' }],
    keywords: ['json export', 'json to excel', 'convert json to xlsx', 'json to csv', 'no-code json converter', 'secure data converter', 'excel conversion tool', 'offline json parser'],
    creator: 'JsonExport',
    publisher: 'JsonExport',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    openGraph: {
        title: 'JsonExport | Convert JSON to Excel Free & Secure',
        description: 'Stop struggling with JSON. Convert data to Excel instantly with JsonExport. 100% Private & Secure.',
        url: 'https://jsonexport.com',
        siteName: 'JsonExport',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'JsonExport | Convert JSON to Excel Free & Secure',
        description: 'Stop struggling with JSON. Convert data to Excel instantly. 100% Private.',
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
        <html lang="en">
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}

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
                </ThemeProvider>
            </body>
        </html>
    )
}
