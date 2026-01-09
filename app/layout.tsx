import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Secure JSON to Excel Converter | JSON Hub',
    description: 'Instantly convert JSON to Excel/CSV in your browser. 100% Private - your data never leaves this device. Perfect for accountants and analysts.',
    applicationName: 'JSON Hub',
    authors: [{ name: 'JSON Hub Team' }],
    keywords: ['json to excel', 'json to csv', 'secure json converter', 'client-side json tools', 'convert api to excel', 'json formatter', 'excel converter'],
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
        title: 'Secure JSON to Excel Converter | JSON Hub',
        description: 'Convert complex JSON to Excel/CSV instantly in your browser. 100% Private & Secure.',
        url: 'https://jsonhub.com',
        siteName: 'JSON Hub',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Secure JSON to Excel Converter | JSON Hub',
        description: 'Convert complex JSON to Excel/CSV instantly in your browser. 100% Private.',
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
                    {/* Google AdSense Placeholder - Replace ca-pub-XXXXXXXXXXXXXXXX with your actual ID */}
                    <Script
                        id="adsense-init"
                        async
                        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
                        crossOrigin="anonymous"
                        strategy="lazyOnload"
                    />
                </ThemeProvider>
            </body>
        </html>
    )
}
