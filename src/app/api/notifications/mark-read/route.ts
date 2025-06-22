// src/app/api/notifications/mark-read/route.ts
// Handles marking notifications as read in the database.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
    const { notificationIds } = await req.json(); // Expects an array of notification IDs

    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];

    if (!idToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decodedToken;
    try {
        decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
        console.error('Error verifying token:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const notificationsRef = db
        .collection('users')
        .doc(userId)
        .collection('notifications');

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return NextResponse.json(
            {
                error: 'Invalid request: notificationIds must be a non-empty array',
            },
            { status: 400 }
        );
    }

    try {
        const batch = db.batch();
        notificationIds.forEach((id) => {
            const docRef = notificationsRef.doc(id);
            batch.update(docRef, { isRead: true });
        });
        await batch.commit();

        return NextResponse.json({
            success: true,
            message: 'Notifications marked as read.',
        });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
