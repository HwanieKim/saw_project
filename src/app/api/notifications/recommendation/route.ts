//src/app/api/notifications/recommendation/route.ts
// API endpoint for sending movie recommendation notifications
import { NextRequest, NextResponse } from 'next/server';
import { sendMovieRecommendationNotification } from '@/firebase/notificationService';

export async function POST(req: NextRequest) {
    try {
        const {
            recommenderId,
            recommenderName,
            recipientId,
            movieId,
            movieTitle,
            reason,
        } = await req.json();

        if (
            !recommenderId ||
            !recommenderName ||
            !recipientId ||
            !movieId ||
            !movieTitle
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await sendMovieRecommendationNotification(
            recommenderId,
            recommenderName,
            recipientId,
            movieId,
            movieTitle,
            reason
        );

        return NextResponse.json({
            success: true,
            message: 'Movie recommendation notification sent successfully',
        });
    } catch (error) {
        console.error(
            'Error sending movie recommendation notification:',
            error
        );
        return NextResponse.json(
            { error: 'Failed to send movie recommendation notification' },
            { status: 500 }
        );
    }
}
