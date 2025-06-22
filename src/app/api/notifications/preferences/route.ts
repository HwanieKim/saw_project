//src/app/api/notifications/preferences/route.ts
// API endpoint for managing user notification preferences
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import {
    getUserNotificationPreferences,
    updateUserNotificationPreferences,
} from '@/firebase/notificationService';

export async function GET(req: NextRequest) {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const preferences = await getUserNotificationPreferences(userId);

        return NextResponse.json({
            success: true,
            preferences,
        });
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        return NextResponse.json(
            { error: 'Failed to get notification preferences' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { preferences } = await req.json();
        if (!preferences) {
            return NextResponse.json(
                { error: 'Missing required fields: preferences' },
                { status: 400 }
            );
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        await updateUserNotificationPreferences(userId, preferences);

        return NextResponse.json({
            success: true,
            message: 'Notification preferences updated successfully',
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        return NextResponse.json(
            { error: 'Failed to update notification preferences' },
            { status: 500 }
        );
    }
}
