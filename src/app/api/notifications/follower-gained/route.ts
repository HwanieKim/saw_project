//src/app/api/notifications/follower-gained/route.ts
// API endpoint for sending follower gained notifications
import { NextRequest, NextResponse } from 'next/server';
import { sendFollowerGainedNotification } from '@/firebase/notificationService';

export async function POST(req: NextRequest) {
    try {
        const { followerId, followerName, followedUserId } = await req.json();

        if (!followerId || !followerName || !followedUserId) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: followerId, followerName, followedUserId',
                },
                { status: 400 }
            );
        }

        await sendFollowerGainedNotification(
            followerId,
            followerName,
            followedUserId
        );

        return NextResponse.json({
            success: true,
            message: 'Follower gained notification sent successfully',
        });
    } catch (error) {
        console.error('Error sending follower gained notification:', error);
        return NextResponse.json(
            { error: 'Failed to send follower gained notification' },
            { status: 500 }
        );
    }
}
