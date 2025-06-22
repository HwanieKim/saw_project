// Notification bell component for displaying notification count and settings
'use client';

import { useState, useEffect } from 'react';
import { useNotifications, StoredNotification } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
}

export default function NotificationBell() {
    const {
        isSupported,
        permission,
        isLoading,
        isEnabled,
        canRequest,
        requestPermission,
        notifications,
        unreadCount,
        markAsRead,
    } = useNotifications();
    const router = useRouter();

    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (showDropdown && unreadCount > 0) {
            const unreadIds = notifications
                .filter((n) => !n.isRead)
                .map((n) => n.id);
            markAsRead(unreadIds);
        }
    }, [showDropdown, unreadCount, notifications, markAsRead]);

    if (!isSupported) {
        return null; // Don't show anything if notifications aren't supported
    }

    const handleRequestPermission = async () => {
        const success = await requestPermission();
        if (success) {
            alert(
                'Notification permission granted! You will now receive notifications.'
            );
        } else {
            alert(
                'Failed to get notification permission. Please check your browser settings.'
            );
        }
        setShowDropdown(false);
    };

    const handleNotificationClick = (notification: StoredNotification) => {
        if (notification.data?.movieId) {
            router.push(`/movie/${notification.data.movieId}`);
        } else if (notification.data?.followerId) {
            // Assuming you have a user profile page at /u/[username]
            // You might need to fetch username from followerId or adjust the route
        }
        setShowDropdown(false);
    };

    const getBellIcon = () => {
        if (isLoading) {
            return (
                <svg
                    className="w-6 h-6 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            );
        }

        if (isEnabled) {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
            );
        }

        if (permission === 'denied') {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                </svg>
            );
        }

        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>
        );
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                title="Notifications">
                {getBellIcon()}

                {/* Notification indicator */}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                    </div>

                    <div className="overflow-y-auto flex-grow">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() =>
                                        handleNotificationClick(notification)
                                    }
                                    className={`p-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                        !notification.isRead
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : ''
                                    }`}>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                                        {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {notification.body}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {timeAgo(
                                            notification.createdAt.toString()
                                        )}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                {canRequest ? (
                                    <>
                                        <p className="mb-3">
                                            Enable notifications to stay
                                            updated.
                                        </p>
                                        <button
                                            onClick={handleRequestPermission}
                                            disabled={isLoading}
                                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                                            {isLoading
                                                ? 'Enabling...'
                                                : 'Enable Notifications'}
                                        </button>
                                    </>
                                ) : (
                                    <p>You have no new notifications.</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <a
                            href="/settings/notifications"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push('/settings/notifications');
                                setShowDropdown(false);
                            }}
                            className="block text-center w-full px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            Manage Notification Settings
                        </a>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}
