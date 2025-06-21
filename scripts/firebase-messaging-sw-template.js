// scripts/firebase-messaging-sw-template.js

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage} from 'firebase/messaging/sw';

// esbuild가 이 변수를 실제 Firebase 구성 객체로 교체해줍니다.
const firebaseConfig = process.env.FIREBASE_CONFIG;

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    console.log('[SW] Firebase background message received:', payload);

    const notificationTitle = payload.notification?.title;
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/icon-192x192.png',
    };
    console.log('[SW] Notification title:', notificationTitle);
    console.log('[SW] Notification options:', notificationOptions);

    if (!notificationTitle) {
        console.warn('[SW] Notification title is missing in the payload.');
        return;
    }
    console.log('self.registration', self.registration);

    self.registration.showNotification(notificationTitle, notificationOptions);
});


self.addEventListener('push', (event) => {
    // The FCM SDK's default push handler is supposed to handle this,
    // but it crashes on non-JSON payloads, which are sent by the FCM console's test message feature.
    // This custom handler will intercept the push, create a valid notification, and display it.
    console.log('[SW] Push event received.');

    if (!event.data) {
        console.warn('[SW] Push event contained no data. Skipping.');
        return;
    }

    let notificationData = {};

    try {
        // If the payload is JSON, use it.
        notificationData = event.data.json();
    } catch {
        // If the payload is not JSON (e.g., plain text), create a notification object.
        const title = event.data.text();
        console.log('[SW] Push received with plain text payload:', title);
        notificationData = {
            notification: {
                title: title,
                body: 'This is a test notification.',
                icon: '/icon-192x192.png',
            },
        };
    }

    const notificationTitle = notificationData.notification.title;
    const notificationOptions = {
        body: notificationData.notification.body,
        icon: notificationData.notification.icon || '/icon-192x192.png',
        data: notificationData.notification.data,
    };

    event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
    );
});

const CACHE_NAME = 'cineshelf-v1';
const urlsToCache = [
    '/',
    '/offline.html',
    '/manifest.json'
];

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
        return; 
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
                        if (request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
                })
        );
    }
});

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