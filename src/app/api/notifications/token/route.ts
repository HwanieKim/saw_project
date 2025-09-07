//src/app/api/notifications/token/route.ts
// API endpoint for managing user notification tokens (store/remove/get)
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import {
    removeUserNotificationToken,
    getUserNotificationTokens,
} from '@/firebase/notificationService';
import { storeUserNotificationToken } from '@/firebase/admin';

export async function POST(req: NextRequest) {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { token } = await req.json();
        if (!token) {
            return NextResponse.json(
                { error: 'Missing required field: token' },
                { status: 400 }
            );
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        await storeUserNotificationToken(userId, token);

        return NextResponse.json({
            success: true,
            message: 'Notification token stored successfully',
        });
    } catch (error) {
        console.error('Error storing notification token:', error);
        return NextResponse.json(
            { error: 'Failed to store notification token' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { token } = await req.json();
        if (!token) {
            return NextResponse.json(
                { error: 'Missing required field: token' },
                { status: 400 }
            );
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        await removeUserNotificationToken(userId, token);

        return NextResponse.json({
            success: true,
            message: 'Notification token removed successfully',
        });
    } catch (error) {
        console.error('Error removing notification token:', error);
        return NextResponse.json(
            { error: 'Failed to remove notification token' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const tokens = await getUserNotificationTokens(userId);

        return NextResponse.json({
            success: true,
            tokens: tokens, // Return full tokens for internal use
            count: tokens.length,
            hasTokens: tokens.length > 0,
        });
    } catch (error) {
        console.error('Error getting notification tokens:', error);
        return NextResponse.json(
            { error: 'Failed to get notification tokens' },
            { status: 500 }
        );
    }
}
