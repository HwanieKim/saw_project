// src/app/api/social/follow/route.ts
// Handles following and unfollowing users securely on the server.
import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { sendFollowerGainedNotification } from '@/firebase/notificationService';

export async function POST(req: NextRequest) {
    const { targetUserId, action } = await req.json(); // action: 'follow' or 'unfollow'

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

    const currentUserId = decodedToken.uid;

    if (!targetUserId || !action || currentUserId === targetUserId) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const currentUserRef = db.collection('users').doc(currentUserId);
    const targetUserRef = db.collection('users').doc(targetUserId);

    try {
        if (action === 'follow') {
            const batch = db.batch();
            // Add target to current user's following subcollection
            batch.set(
                currentUserRef.collection('following').doc(targetUserId),
                { followedAt: new Date() }
            );
            // Add current user to target's followers subcollection
            batch.set(
                targetUserRef.collection('followers').doc(currentUserId),
                { followedAt: new Date() }
            );

            // Increment following count for current user and followers count for target user
            batch.update(currentUserRef, {
                followingCount: admin.firestore.FieldValue.increment(1),
            });
            batch.update(targetUserRef, {
                followersCount: admin.firestore.FieldValue.increment(1),
            });

            await batch.commit();

            // Send notification to the followed user
            try {
                // Get current user's display name
                const currentUserDoc = await currentUserRef.get();
                const currentUserData = currentUserDoc.data();
                const followerName =
                    currentUserData?.displayName ||
                    currentUserData?.username ||
                    'Someone';

                await sendFollowerGainedNotification(
                    currentUserId,
                    followerName,
                    targetUserId
                );
            } catch (notificationError) {
                console.error(
                    'Error sending follower notification:',
                    notificationError
                );
                // Don't fail the follow operation if notification fails
            }

            return NextResponse.json({
                success: true,
                message: 'Successfully followed user.',
            });
        } else if (action === 'unfollow') {
            const batch = db.batch();

            batch.delete(
                currentUserRef.collection('following').doc(targetUserId)
            );
            batch.delete(
                targetUserRef.collection('followers').doc(currentUserId)
            );

            batch.update(currentUserRef, {
                followingCount: admin.firestore.FieldValue.increment(-1),
            });
            batch.update(targetUserRef, {
                followersCount: admin.firestore.FieldValue.increment(-1),
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: 'Successfully unfollowed user.',
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error in follow/unfollow transaction:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
