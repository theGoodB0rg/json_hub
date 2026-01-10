import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Convert JSON to Excel Free | Secure & Private Tool',
    description: 'The easiest way to convert JSON files to Excel (XLSX) or CSV. Private, secure, and free. No coding required. Perfect for business analysts and reporting.',
    applicationName: 'JSON Hub',
    authors: [{ name: 'JSON Hub Team' }],
    keywords: ['json to excel', 'convert json to xlsx', 'json to csv', 'no-code json converter', 'secure data converter', 'excel conversion tool', 'offline json parser'],
    creator: 'JSON Hub',
    publisher: 'JSON Hub',
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
        title: 'Convert JSON to Excel Free | Secure & Private Tool',
        description: 'Stop struggling with JSON. Convert data to Excel instantly in your browser. 100% Private & Secure.',
        url: 'https://jsonhub.com',
        siteName: 'JSON Hub',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Convert JSON to Excel Free | Secure & Private Tool',
        description: 'Stop struggling with JSON. Convert data to Excel instantly in your browser. 100% Private.',
        creator: '@jsonhub',
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
                                "name": "JSON Hub",
                                "applicationCategory": "DeveloperApplication",
                                "operatingSystem": "Any (Web-based)",
                                "offers": {
                                    "@type": "Offer",
                                    "price": "0",
                                    "priceCurrency": "USD"
                                },
                                "description": "Convert JSON to Excel, CSV, or HTML. 100% private, client-side processing. No coding required.",
                                "url": "https://jsonhub.com",
                                "aggregateRating": {
                                    "@type": "AggregateRating",
                                    "ratingValue": "4.8",
                                    "ratingCount": "127",
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
