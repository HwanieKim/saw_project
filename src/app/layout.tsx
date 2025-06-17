import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'CineShelf - Your Movie Collection',
    description:
        'Discover, organize, and share your favorite movies with friends',
    manifest: '/manifest.json',
    themeColor: '#4F46E5',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'CineShelf',
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
            { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <meta name="application-name" content="CineShelf" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta name="apple-mobile-web-app-title" content="CineShelf" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="msapplication-TileColor" content="#4F46E5" />
                <meta name="msapplication-tap-highlight" content="no" />
            </head>
            <body className={geistMono.className}>
                <AuthProvider>
                    <Navbar />
                    <main className="container mx-auto p-4">{children}</main>
                </AuthProvider>
            </body>
        </html>
    );
}
