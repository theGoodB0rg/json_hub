import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'JSON Hub - Smart JSON Bridge',
    description: 'Convert complex JSON to Excel/CSV with auto-unescape and flattening',
    applicationName: 'JSON Hub',
    authors: [{ name: 'JSON Hub Team' }],
    keywords: ['json', 'csv', 'excel', 'converter', 'flatten', 'unescape', 'developer tools'],
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
        title: 'JSON Hub - Smart JSON Bridge',
        description: 'Convert complex JSON to Excel/CSV with auto-unescape and flattening. Handle messy API responses with ease.',
        url: 'https://jsonhub.com',
        siteName: 'JSON Hub',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'JSON Hub - Smart JSON Bridge',
        description: 'Convert complex JSON to Excel/CSV with auto-unescape and flattening',
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
                {children}
                {/* Google AdSense Placeholder - Replace ca-pub-XXXXXXXXXXXXXXXX with your actual ID */}
                <Script
                    id="adsense-init"
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
                    crossOrigin="anonymous"
                    strategy="lazyOnload"
                />
            </body>
        </html>
    )
}
