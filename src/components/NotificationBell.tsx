'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
    const {
        isSupported,
        permission,
        isLoading,
        isEnabled,
        canRequest,
        requestPermission,
        lastNotification,
    } = useNotifications();

    const [showDropdown, setShowDropdown] = useState(false);

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
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5v-5z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            );
        }

        if (permission === 'denied') {
            return (
                <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                </svg>
            );
        }

        return (
            <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
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

                {/* Notification indicator */}
                {lastNotification && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Notifications
                        </h3>

                        {lastNotification && (
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                    Latest Notification
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                    {lastNotification.title}
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {lastNotification.body}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {permission === 'default' && (
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                        Enable notifications to stay updated
                                        with your friends' activities
                                    </p>
                                    <button
                                        onClick={handleRequestPermission}
                                        disabled={isLoading}
                                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                                        {isLoading
                                            ? 'Enabling...'
                                            : 'Enable Notifications'}
                                    </button>
                                </div>
                            )}

                            {permission === 'denied' && (
                                <div className="text-center">
                                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                                        Notifications are blocked. Please enable
                                        them in your browser settings.
                                    </p>
                                    <button
                                        onClick={() => {
                                            alert(
                                                'Please go to your browser settings and enable notifications for this site.'
                                            );
                                            setShowDropdown(false);
                                        }}
                                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                                        How to Enable
                                    </button>
                                </div>
                            )}

                            {isEnabled && (
                                <div className="text-center">
                                    <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                                        ✓ Notifications are enabled
                                    </p>
                                    <a
                                        href="/settings/notifications"
                                        className="block w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                                        Manage Settings
                                    </a>
                                </div>
                            )}
                        </div>
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
