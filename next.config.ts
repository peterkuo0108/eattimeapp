import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Add this line to enable static export
  basePath: '/eattime', // Add this for GitHub Pages if your repo is 'eattime'
  assetPrefix: '/eattime', // Helps ensure assets (JS, CSS, images) load correctly from the /eattime/ path on GitHub Pages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export
    // remotePatterns can be kept if picsum.photos is still used,
    // but unoptimized:true is the key for static export.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // trailingSlash: false, // Default Next.js behavior, generally fine for GitHub Pages.
};

export default nextConfig;
