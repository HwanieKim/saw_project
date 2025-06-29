//src/app/api/notifications/followed-user-review/route.ts
// API endpoint for sending notifications when followed users review movies
import { NextRequest, NextResponse } from 'next/server';
import { sendFollowedUserReviewNotification } from '@/firebase/notificationService';

export async function POST(req: NextRequest) {
    try {
        const {
            reviewerId,
            reviewerName,
            movieId,
            movieTitle,
            rating,
            followerIds,
        } = await req.json();

        if (
            !reviewerId ||
            !reviewerName ||
            !movieId ||
            !movieTitle ||
            !rating ||
            !followerIds
        ) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: reviewerId, reviewerName, movieId, movieTitle, rating, followerIds',
                },
                { status: 400 }
            );
        }

        if (!Array.isArray(followerIds)) {
            return NextResponse.json(
                { error: 'followerIds must be an array' },
                { status: 400 }
            );
        }

        await sendFollowedUserReviewNotification(
            reviewerId,
            reviewerName,
            movieId,
            movieTitle,
            rating,
            followerIds
        );

        return NextResponse.json({
            success: true,
            message: 'Followed user review notification sent successfully',
            notifiedCount: followerIds.length,
        });
    } catch (error) {
        console.error(
            'Error sending followed user review notification:',
            error
        );
        return NextResponse.json(
            { error: 'Failed to send followed user review notification' },
            { status: 500 }
        );
    }
}
