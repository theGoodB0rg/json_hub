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
                </ThemeProvider>
            </body>
        </html>
    )
}
