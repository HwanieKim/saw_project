//src/app/settings/notifications/page.tsx
// Notification settings page for managing user notification preferences

'use client';

import { useAuth } from '@/context/AuthContext';
import NotificationSettings from '@/components/NotificationSettings';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotificationSettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Notification Settings
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage how you receive notifications about movies,
                            followers, and more.
                        </p>
                    </div>

                    <NotificationSettings />
                </div>
            </div>
        </div>
    );
}
