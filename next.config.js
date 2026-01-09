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
}

module.exports = nextConfig
