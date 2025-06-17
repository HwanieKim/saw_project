import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = withPWA({
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                port: '',
                pathname: '/t/p/**',
            },
        ],
    },
    pwa: {
        dest: 'public',
        register: true,
        skipWaiting: true,
        disable: process.env.NODE_ENV === 'development',
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/api\.themoviedb\.org\/.*$/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'tmdb-api-cache',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60 * 24, // 24 hours
                    },
                },
            },
            {
                urlPattern: /^https:\/\/image\.tmdb\.org\/.*$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'tmdb-images-cache',
                    expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                    },
                },
            },
        ],
    },
});

export default nextConfig;
