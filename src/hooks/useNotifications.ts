//src/hooks/useNotifications.ts
// React hook for managing notification permissions, tokens, and preferences
import { useState, useEffect, useCallback } from 'react';
import { onForegroundMessage } from '@/firebase/fcm';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config'; // Client-side Firestore instance
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    deleteDoc,
    doc,
} from 'firebase/firestore';

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
    const [isLoading, setIsLoading] = useState(false);
    const [preferences, setPreferences] =
        useState<NotificationPreferences | null>(null);
    const [notifications, setNotifications] = useState<StoredNotification[]>(
        []
    );
    const [unreadCount, setUnreadCount] = useState(0);

    const { user, userProfile, idToken } = useAuth();

    // fcm token from user profile
    const token = userProfile?.fcmToken || null;
    const isEnabled = permission === 'granted' && !!token;

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

    // sync permission state when userProfile.fcmToken changes
    useEffect(() => {
        if (isSupported) {
            setPermission(Notification.permission);
        }
    }, [isSupported, userProfile?.fcmToken]); // re check permission when userProfile.fcmToken changes

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

    const requestPermission = useCallback(async () => {
        if (!isSupported) return false;

        // Check if permission is already granted
        if (Notification.permission === 'granted') {
            setPermission('granted');
            return true;
        }

        setIsLoading(true);
        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported]);

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
            if (!user || !idToken) return false;

            try {
                console.log('Updating preferences:', newPreferences);

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

                if (!response.ok) {
                    console.error('api request failed', response.status);
                    return false;
                }
                // Update local state
                setPreferences((prev) => {
                    const updated = {
                        ...(prev || {}), // ensure prev is an object
                        ...newPreferences,
                    } as NotificationPreferences;
                    console.log('Updated preferences:', updated);
                    return updated;
                });

                return true;
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

    // Remove FCM token from backend and update state
    const removeToken = useCallback(async () => {
        if (!user || !token || !idToken) return;

        try {
            // remove from collection userNotificationTokens
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

            // Update permission status (token is managed in AuthContext)
            setPermission('denied');
            console.log('FCM token removed from notifications system');
        } catch (error) {
            console.error('Error removing notification token:', error);
        }
    }, [user, token, idToken]);

    // Add notification to the list
    const addNotification = useCallback((notification: NotificationMessage) => {
        const stored: StoredNotification = {
            ...notification,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            isRead: false,
            type: notification.data?.type || 'general',
        };
        setNotifications((prev) => [stored, ...prev]);
    }, []);

    // Remove notification by index
    const removeNotification = useCallback((index: number) => {
        setNotifications((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // Handle foreground messages
    useEffect(() => {
        if (!isSupported) return;

        const unsubscribe = onForegroundMessage((payload) => {
            const notification: NotificationMessage = {
                title: payload.notification?.title || 'New Notification',
                body: payload.notification?.body || '',
                data: payload.data,
            };
            addNotification(notification);
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
    }, [isSupported, addNotification]);

    // Load preferences when user changes
    useEffect(() => {
        if (user) {
            loadPreferences();
        }
    }, [user, loadPreferences]);

    // Prompt for permission if supported, user is logged in, permission is default, and no token
    useEffect(() => {
        if (user && isSupported && permission === 'default' && !token) {
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
    }, [user, isSupported, permission, token, requestPermission]);

    // Remove notification from Firestore
    const deleteNotification = useCallback(
        async (notificationId: string) => {
            if (!user) return;
            try {
                await deleteDoc(
                    doc(db, 'users', user.uid, 'notifications', notificationId)
                );
            } catch (error) {
                console.error('Error deleting notification:', error);
            }
        },
        [user]
    );

    return {
        // State
        isSupported,
        permission,
        token,
        isLoading,
        preferences,
        notifications,
        unreadCount,
        isEnabled,

        // Actions
        requestPermission,
        updatePreferences,
        removeToken,
        loadPreferences,
        markAsRead,
        addNotification,
        removeNotification,
        deleteNotification,

        // Computed
        canRequest:
            isSupported &&
            (permission === 'default' || permission === 'denied'),
    };
}
