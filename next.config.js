/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    // Enable static export for $0 hosting
    output: 'export',

    // Disable image optimization for static export
    images: {
        unoptimized: true,
    },

    // Protect source code: Disable source maps in production
    productionBrowserSourceMaps: false,

    // Performance optimizations
    compiler: {
        // Remove console.log in production
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Experimental: Optimize CSS and package imports
    experimental: {
        optimizeCss: true,
        optimizePackageImports: ['react-icons', 'lucide-react', '@monaco-editor/react'],
    },
}

module.exports = nextConfig
