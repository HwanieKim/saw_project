// src/app/api/sendnotification/route.ts
// debugging
console.log('api called');
import { NextRequest, NextResponse } from 'next/server';
import { sendSimpleNotification } from '@/firebase/admin';

export async function POST(req: NextRequest) {
    console.log('[/api/sendnotification] Received a request.');

    try {
        const { token, title, body } = await req.json();

        if (!token || !title || !body) {
            console.error('[/api/sendnotification] Missing required fields.');
            return NextResponse.json(
                { message: 'Missing token, title, or body' },
                { status: 400 }
            );
        }

        console.log(
            `[/api/sendnotification] Sending message to token: ${token}`
        );

        const results = await sendSimpleNotification(token, title, body);
        const response = results[0]; // We are only sending to one token

        if (response.success) {
            console.log('✅ Firebase send response:', response);
            return NextResponse.json({ success: true, response });
        } else {
            console.error('❌ Firebase send error:', response);
            return NextResponse.json(
                {
                    success: false,
                    error: response.error || 'Failed to send notification',
                },
                { status: 500 }
            );
        }
    } catch (error: unknown) {
        console.error('❌ API error in /api/sendnotification:', error);

        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
