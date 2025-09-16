'use client';
// Component for managing user notification preferences
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPreferences {
    movieReviews: boolean;
    followerGained: boolean;
    followedUserReviews: boolean;
    recommendations: boolean;
    general: boolean;
}

export default function NotificationSettings() {
    const {
        permission,
        isLoading,
        preferences,
        isEnabled,
        canRequest,
        requestPermission,
        updatePreferences,
        removeToken,
    } = useNotifications();
    const { loading: authLoading } = useAuth();
    const [localPreferences, setLocalPreferences] =
        useState<NotificationPreferences | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (preferences) {
            setLocalPreferences(preferences);
        }
    }, [preferences]);

    // preference handle function: optimistic update + rollback on failure
    const handlePreferenceChange = async (
        key: keyof NotificationPreferences,
        value: boolean
    ) => {
        if (!localPreferences) return;

        const prev = localPreferences;
        const updated = { ...prev, [key]: value };
        setLocalPreferences(updated);
        setIsUpdating(true);

        try {
            const success = await updatePreferences({ [key]: value });
            if (!success) {
                console.error('Rollback preference change:', key);
                setLocalPreferences(prev);
                alert('Failed to update notification preference.');
            } else {
                console.log(`Preference ${key} updated:`, value);
            }
        } catch (error) {
            console.error('Error updating preference:', error);
            setLocalPreferences(prev);
            alert('Failed to update notification preference.');
        } finally {
            setIsUpdating(false);
        }
    };

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
    };

    const handleRemoveToken = async () => {
        if (
            confirm(
                'Are you sure you want to disable notifications? You can re-enable them later.'
            )
        ) {
            await removeToken();
            alert('Notifications have been disabled.');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Notification Settings
            </h2>

            {/* Permission Status */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    Permission Status
                </h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            Push Notifications
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {permission === 'granted' &&
                                'Enabled - You will receive notifications'}
                            {permission === 'denied' &&
                                'Disabled - Notifications are blocked. Please enable them in your browser settings.'}
                            {permission === 'default' &&
                                'Not set - Click to enable notifications'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {canRequest && (
                            <button
                                onClick={handleRequestPermission}
                                disabled={isLoading || authLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                                {isLoading
                                    ? 'Enabling...'
                                    : 'Enable Notifications'}
                            </button>
                        )}
                        {isEnabled && (
                            <button
                                onClick={handleRemoveToken}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                                Disable
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {permission !== 'granted' && (
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                    <p className="text-yellow-800 dark:text-yellow-200">
                        ⚠️ Notifications are not allowed. Grant permission to
                        see notification toggles.
                    </p>
                </div>
            )}

            {permission === 'granted' && !localPreferences && (
                <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded">
                    <p className="text-blue-800 dark:text-blue-200">
                        🔄 Loading preferences...
                    </p>
                </div>
            )}

            {/* Notification Preferences */}
            {permission === 'granted' && localPreferences && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                        Notification Types
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Choose which types of notifications you want to receive:
                    </p>

                    <div className="space-y-4">
                        {Object.entries(localPreferences).map(
                            ([key, value]) => {
                                if (key === 'type') return null;
                                return (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {key === 'movieReviews' &&
                                                    'Movie Reviews'}
                                                {key === 'followerGained' &&
                                                    'New Followers'}
                                                {key ===
                                                    'followedUserReviews' &&
                                                    'Followed User Reviews'}
                                                {key === 'recommendations' &&
                                                    'Movie Recommendations'}
                                                {key === 'general' &&
                                                    'General Notifications'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {key === 'movieReviews' &&
                                                    'When someone reviews a movie in your watchlist'}
                                                {key === 'followerGained' &&
                                                    'When someone starts following you'}
                                                {key ===
                                                    'followedUserReviews' &&
                                                    'When someone you follow reviews a movie'}
                                                {key === 'recommendations' &&
                                                    'When someone recommends a movie to you'}
                                                {key === 'general' &&
                                                    'Important updates and announcements'}
                                            </p>
                                        </div>

                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(value)}
                                                onChange={(e) =>
                                                    handlePreferenceChange(
                                                        key as keyof NotificationPreferences,
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={isUpdating}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    {isUpdating && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            Updating preferences...
                        </p>
                    )}
                </div>
            )}

            {/* Help Text */}
            {!isEnabled && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Why enable notifications?
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>
                            • Get notified when friends review movies
                            you&apos;re interested in
                        </li>
                        <li>
                            • Stay updated on friend requests and watchlist
                            changes
                        </li>
                        <li>• Receive personalized movie recommendations</li>
                        <li>
                            • Never miss important updates about your account
                        </li>
                    </ul>
                </div>
            )}

            {/* Permission Denied Help */}
            {permission === 'denied' && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                        How to enable notifications
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                        Notifications are currently blocked. To enable them:
                    </p>
                    <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2 list-decimal list-inside">
                        Click &quot;Enable Notifications&quot; above and allow
                        notifications in your browser.
                    </ol>
                </div>
            )}
        </div>
    );
}
