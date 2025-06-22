//src/hooks/useNotifications.ts
// React hook for managing notification permissions, tokens, and preferences
import { useState, useEffect, useCallback } from 'react';
import {
    requestNotificationPermission,
    onForegroundMessage,
} from '@/firebase/fcm';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config'; // Client-side Firestore instance
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

interface NotificationPreferences {
    movieReviews: boolean;
    followerGained: boolean;
    followedUserReviews: boolean;
    recommendations: boolean;
    general: boolean;
    type: string;
}

interface NotificationMessage {
    title: string;
    body: string;
    data?: Record<string, string>;
}

export interface StoredNotification extends NotificationMessage {
    id: string;
    createdAt: string; // or Date
    isRead: boolean;
    type: string;
}

export function useNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] =
        useState<NotificationPermission>('default');
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [preferences, setPreferences] =
        useState<NotificationPreferences | null>(null);
    const [lastNotification, setLastNotification] =
        useState<NotificationMessage | null>(null);
    const [notifications, setNotifications] = useState<StoredNotification[]>(
        []
    );
    const [unreadCount, setUnreadCount] = useState(0);
    const { user, idToken } = useAuth();

    // Check if notifications are supported
    useEffect(() => {
        const checkSupport = () => {
            const supported =
                'Notification' in window && 'serviceWorker' in navigator;
            setIsSupported(supported);

            if (supported) {
                setPermission(Notification.permission);
            }
        };

        checkSupport();
    }, []);

    // Set up real-time listener for notifications
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setIsLoading(true);
        const notificationsRef = collection(
            db,
            'users',
            user.uid,
            'notifications'
        );
        const q = query(notificationsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedNotifications = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt:
                            data.createdAt?.toDate().toISOString() ||
                            new Date().toISOString(),
                    } as StoredNotification;
                });

                setNotifications(fetchedNotifications);
                setUnreadCount(
                    fetchedNotifications.filter((n) => !n.isRead).length
                );
                setIsLoading(false);
            },
            (error) => {
                console.error('Error listening to notifications:', error);
                setIsLoading(false);
            }
        );

        // Cleanup listener on component unmount or user change
        return () => unsubscribe();
    }, [user]);

    // Check and sync token status when user changes
    useEffect(() => {
        if (!user || !idToken || !isSupported) return;

        const checkAndSyncToken = async () => {
            try {
                // Check if user has stored tokens in backend
                const response = await fetch('/api/notifications/token', {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const hasStoredTokens = data.hasTokens;

                    // If browser permission is granted but no stored tokens, get a new token
                    if (
                        permission === 'granted' &&
                        !hasStoredTokens &&
                        !token
                    ) {
                        console.log(
                            'Permission granted but no stored tokens. Getting new token...'
                        );
                        const fcmToken = await requestNotificationPermission();
                        if (fcmToken) {
                            setToken(fcmToken);
                            // Store token in backend
                            await fetch('/api/notifications/token', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${idToken}`,
                                },
                                body: JSON.stringify({
                                    token: fcmToken,
                                    platform: 'web',
                                }),
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking token status:', error);
            }
        };

        checkAndSyncToken();
    }, [user, idToken, isSupported, permission, token]);

    // Mark notifications as read
    const markAsRead = useCallback(
        async (notificationIds: string[]) => {
            if (!user || !idToken || notificationIds.length === 0) return;

            try {
                await fetch('/api/notifications/mark-read', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({ notificationIds }),
                });

                // Update local state
                setNotifications((prev) =>
                    prev.map((n) =>
                        notificationIds.includes(n.id)
                            ? { ...n, isRead: true }
                            : n
                    )
                );
                setUnreadCount((prev) => prev - notificationIds.length);
            } catch (error) {
                console.error('Error marking notifications as read:', error);
            }
        },
        [user, idToken]
    );

    // Request notification permission and get token
    const requestPermission = useCallback(async () => {
        if (!isSupported || !user || !idToken) return false;

        setIsLoading(true);
        try {
            const fcmToken = await requestNotificationPermission();

            if (fcmToken) {
                setToken(fcmToken);
                setPermission(Notification.permission);

                // Store token in backend
                await fetch('/api/notifications/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        token: fcmToken,
                        platform: 'web',
                    }),
                });

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, user, idToken]);

    // Load notification preferences
    const loadPreferences = useCallback(async () => {
        if (!user || !idToken) return;

        try {
            const response = await fetch(`/api/notifications/preferences`, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPreferences(data.preferences);
            }
        } catch (error) {
            console.error('Error loading notification preferences:', error);
        }
    }, [user, idToken]);

    // Update notification preferences
    const updatePreferences = useCallback(
        async (newPreferences: Partial<NotificationPreferences>) => {
            if (!user || !idToken) return;

            try {
                const response = await fetch('/api/notifications/preferences', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        preferences: newPreferences,
                    }),
                });

                if (response.ok) {
                    setPreferences(
                        (prev) =>
                            ({
                                ...prev,
                                ...newPreferences,
                            } as NotificationPreferences)
                    );
                    return true;
                }
                return false;
            } catch (error) {
                console.error(
                    'Error updating notification preferences:',
                    error
                );
                return false;
            }
        },
        [user, idToken]
    );

    // Remove notification token
    const removeToken = useCallback(async () => {
        if (!user || !token || !idToken) return;

        try {
            await fetch('/api/notifications/token', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    token: token,
                }),
            });

            setToken(null);
            setPermission('denied');
        } catch (error) {
            console.error('Error removing notification token:', error);
        }
    }, [user, token, idToken]);

    // Handle foreground messages
    useEffect(() => {
        if (!isSupported) return;

        const unsubscribe = onForegroundMessage((payload) => {
            const notification: NotificationMessage = {
                title: payload.notification?.title || 'New Notification',
                body: payload.notification?.body || '',
                data: payload.data,
            };

            setLastNotification(notification);
            // No need to fetch manually, onSnapshot will handle it.

            // Show browser notification if permission is granted
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.body,
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    data: notification.data,
                });
            }
        });

        return unsubscribe;
    }, [isSupported]);

    // Load preferences when user changes
    useEffect(() => {
        if (user) {
            loadPreferences();
        }
    }, [user, loadPreferences]);

    // Auto-request permission when user is authenticated
    useEffect(() => {
        if (user && isSupported && permission === 'default') {
            const askForPermission = async () => {
                const wantsPermission = confirm(
                    'To stay up-to-date with reviews and followers, please allow notifications.'
                );
                if (wantsPermission) {
                    await requestPermission();
                }
            };
            // Use a small delay to not be too intrusive right on login.
            const timer = setTimeout(askForPermission, 3000);
            return () => clearTimeout(timer);
        }
    }, [user, isSupported, permission, requestPermission]);

    return {
        // State
        isSupported,
        permission,
        token,
        isLoading,
        preferences,
        lastNotification,
        notifications,
        unreadCount,

        // Actions
        requestPermission,
        updatePreferences,
        removeToken,
        loadPreferences,
        markAsRead,

        // Computed
        isEnabled: permission === 'granted' && !!token,
        canRequest:
            isSupported &&
            (permission === 'default' || permission === 'denied'),
    };
}
