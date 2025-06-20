//src/firebase/fcm.ts

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './config';
import type { MessagePayload } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const messagingInstance =
    typeof window !== 'undefined' ? getMessaging(app) : null;

export async function requestNotificationPermission() {
    if (!messagingInstance) return null;

    try {
        // 1. Register the service worker and get the registration object.
        const serviceWorkerRegistration =
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', serviceWorkerRegistration);

        // 2. Wait for the service worker to become active.
        // The '.ready' promise resolves when a worker is active.
        await navigator.serviceWorker.ready;
        console.log('Service Worker is active and ready.');

        // 3. Now that we're sure the worker is active, request permission.
        const permission = await Notification.requestPermission();
        console.log('Permission status:', permission);

        if (permission === 'granted') {
            // 4. Finally, get the token.
            const token = await getToken(messagingInstance, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: serviceWorkerRegistration,
            });

            console.log('FCM Token:', token);
            return token;
        } else {
            console.warn('Notification permission was not granted.');
            return null;
        }
    } catch (err) {
        console.error(
            'An error occurred during notification permission request:',
            err
        );
        return null;
    }
}

export function onForegroundMessage(
    callback: (payload: MessagePayload) => void
) {
    if (!messagingInstance) return;
    onMessage(messagingInstance, callback);
}
