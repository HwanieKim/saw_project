// scripts/firebase-messaging-sw-template.js

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// IMPORTANT: This file should not be directly used.
// It's a template that's processed by `scripts/generate-sw.mjs` to create the final service worker.

// In the generated sw, this will be replaced with the actual config object.
const firebaseConfig = SCRIPT_REPLACE_FIREBASE_CONFIG;

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize the notification here
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'Something new happened!',
        icon: payload.notification?.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png', // A badge for the notification
        data: {
            url: payload.fcmOptions?.link || payload.data?.url || '/',
        },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// This listener handles the user clicking on the notification.
self.addEventListener('notificationclick', (event) => {
    // Close the notification
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    // This looks for an existing window and focuses it.
    // If no window is open, it opens a new one.
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        }).then((clientList) => {
            for (const client of clientList) {
                // Check if the client's URL matches the one we want to open
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is found, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});


const CACHE_NAME = 'cineshelf-pwa-v1';
const urlsToCache = [
    '/',
    '/offline.html',
    '/manifest.json'
];
// precaching, 
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Let the browser handle requests for Next.js's internal assets.
    if (url.pathname.startsWith('/_next/')) {
        return; // browser default caching, no sw involved
    }
    
    // For other GET requests, use a cache-first strategy.
    if (request.method === 'GET') {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(request).then(
                        (networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                const responseToCache = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => cache.put(request, responseToCache));
                            }
                            return networkResponse;
                        }
                    ).catch(() => {
                        // network failure handling
                        if (request.destination === 'document') {
                            return caches.match('/offline.html');
                        }
                    });
                })
        );
    }
});
// Cache versioning and cleanup
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});