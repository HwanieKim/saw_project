//src/app/api/notifications/bulk/route.ts
// API endpoint for sending bulk notifications to all users
import { NextRequest, NextResponse } from 'next/server';
import { sendBulkNotification } from '@/firebase/notificationService';

export async function POST(req: NextRequest) {
    try {
        const { title, body, data } = await req.json();

        if (!title || !body) {
            return NextResponse.json(
                { error: 'Missing required fields: title and body' },
                { status: 400 }
            );
        }

        const result = await sendBulkNotification(title, body, data);

        return NextResponse.json({
            success: true,
            message: 'Bulk notification sent successfully',
            result,
        });
    } catch (error) {
        console.error('Error sending bulk notification:', error);
        return NextResponse.json(
            { error: 'Failed to send bulk notification' },
            { status: 500 }
        );
    }
}
