import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google'; // Changed font for better minimalist look
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Define metadata object satisfying the Metadata type
export const metadata: Metadata = {
  title: '食刻', // Updated app title
  description: '免費、無廣告的營養管理平台', // Updated app description
  manifest: '/manifest.json', // Link to the manifest file
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '食刻', // Updated app title for Apple Web App
    // startupImage: [...] // Optionally add startup images
  },
};

export const viewport: Viewport = {
  themeColor: '#0d9488', // Match theme color from manifest
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Basic PWA meta tags */}
        <meta name="application-name" content="食刻" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="食刻" />
        <meta name="description" content="免費、無廣告的營養管理平台" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0d9488" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* Link manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Theme color */}
        <meta name="theme-color" content="#0d9488" />
        {/* Add to home screen for Safari on iOS */}
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        {/* Favicon (optional but recommended) */}
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased flex flex-col min-h-full`}
      >
        <main className="flex-grow flex flex-col">{children}</main>
        <Toaster /> {/* Add Toaster for notifications */}
      </body>
    </html>
  );
}
