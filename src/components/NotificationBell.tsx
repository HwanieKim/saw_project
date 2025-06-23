// Notification bell component for displaying notification count and settings
'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
    const {
        isSupported,
        permission,
        isLoading,
        isEnabled,
        notifications,
        removeNotification,
        deleteNotification,
    } = useNotifications();
    const [showDropdown, setShowDropdown] = useState(false);

    if (!isSupported) {
        return null;
    }

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
                title="Notification settings">
                {getBellIcon()}

                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Notifications
                        </h3>
                        {notifications.length === 0 ? (
                            <div className="text-center text-gray-400">
                                No notifications.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((notification, idx) => (
                                    <div
                                        key={idx}
                                        className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg relative">
                                        <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                            {notification.title}
                                        </div>
                                        <div className="text-sm text-blue-700 dark:text-blue-300">
                                            {notification.body}
                                        </div>
                                        <button
                                            onClick={() => {
                                                deleteNotification(
                                                    notification.id
                                                );
                                                removeNotification(idx);
                                            }}
                                            className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">
                                            delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <a
                            href="/settings/notifications"
                            className="block text-center text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
                            Manage Notification Settings
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
