// src/app/api/notifications/route.ts
// Handles fetching user notifications from the database.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

export async function GET(req: NextRequest) {
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

    try {
        const snapshot = await notificationsRef
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        if (snapshot.empty) {
            return NextResponse.json([]);
        }

        const notifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
