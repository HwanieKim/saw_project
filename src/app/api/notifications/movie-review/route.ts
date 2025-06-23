//src/app/api/notifications/movie-review/route.ts
// API endpoint for sending movie review notifications to watchlist users
import { NextRequest, NextResponse } from 'next/server';
import { sendMovieReviewNotificationWithPreference } from '@/firebase/notificationService';

export async function POST(req: NextRequest) {
    try {
        const { reviewerId, movieId, movieTitle, reviewerName, rating } =
            await req.json();

        if (
            !reviewerId ||
            !movieId ||
            !movieTitle ||
            !reviewerName ||
            rating === undefined
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await sendMovieReviewNotificationWithPreference(
            reviewerId,
            movieId,
            movieTitle,
            reviewerName,
            rating
        );

        return NextResponse.json({
            success: true,
            message: 'Movie review notification sent successfully',
        });
    } catch (error) {
        console.error('Error sending movie review notification:', error);
        return NextResponse.json(
            { error: 'Failed to send movie review notification' },
            { status: 500 }
        );
    }
}
