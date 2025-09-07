//src/firebase/admin.ts
// Firebase Admin SDK configuration and core notification sending functions
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
        credential: admin.credential.cert(
            serviceAccount as admin.ServiceAccount
        ),
    });
}

// Get Firestore instance
const db = getFirestore();

// Notification types
export interface NotificationData {
    type:
        | 'movie_review'
        | 'follower_gained'
        | 'followed_user_review'
        | 'recommendation'
        | 'general';
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}

// User notification token interface
export interface UserNotificationToken {
    userId: string;
    token: string;
    createdAt: Date;
    lastUsed: Date;
}

// Send notification to a single user
export async function sendNotificationToUser(
    userId: string,
    notification: NotificationData
): Promise<boolean> {
    try {
        // Get user's notification tokens
        const tokensSnapshot = await db
            .collection('userNotificationTokens')
            .where('userId', '==', userId)
            .get();

        if (tokensSnapshot.empty) {
            console.log(`No notification tokens found for user: ${userId}`);
            return false;
        }

        const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);
        const results = await sendNotificationToTokens(tokens, notification);

        // Update last used timestamp for successful tokens
        const successfulTokens = results.filter((result) => result.success);
        for (const result of successfulTokens) {
            await db
                .collection('userNotificationTokens')
                .where('token', '==', result.token)
                .get()
                .then((snapshot) => {
                    if (!snapshot.empty) {
                        snapshot.docs[0].ref.update({
                            lastUsed: new Date(),
                        });
                    }
                });
        }

        return successfulTokens.length > 0;
    } catch (error) {
        console.error('Error sending notification to user:', error);
        return false;
    }
}

// Send notification to multiple tokens
export async function sendNotificationToTokens(
    tokens: string[],
    notification: NotificationData
): Promise<Array<{ token: string; success: boolean; error?: string }>> {
    if (tokens.length === 0) return [];

    const results: Array<{ token: string; success: boolean; error?: string }> =
        [];

    // Send to each token individually for better error handling
    for (const token of tokens) {
        try {
            // Convert data object to string key-value pairs for webpush
            const webpushData: Record<string, string> = {};
            if (notification.data) {
                Object.entries(notification.data).forEach(([key, value]) => {
                    webpushData[key] = String(value);
                });
            }

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                    ...(notification.imageUrl && {
                        image: notification.imageUrl,
                    }),
                },
                data: notification.data || {},
                token: token,
                webpush: {
                    headers: {
                        Urgency: 'high',
                    },
                    notification: {
                        icon: '/icon-192x192.png',
                        badge: '/icon-192x192.png',
                        ...(Object.keys(webpushData).length > 0 && {
                            data: webpushData,
                        }),
                    },
                },
            };

            await admin.messaging().send(message);
            results.push({ token, success: true });
            console.log(
                `Notification sent successfully to token: ${token.substring(
                    0,
                    20
                )}...`
            );
        } catch (error: any) {
            console.error(
                `Failed to send notification to token ${token.substring(
                    0,
                    20
                )}...:`,
                error
            );

            // Handle specific Firebase errors
            if (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
            ) {
                // Remove invalid token from database
                await removeInvalidToken(token);
            }

            results.push({
                token,
                success: false,
                error: error.message || 'Unknown error',
            });
        }
    }

    return results;
}

/**
 * Sends a simple notification with title and body to a specific token.
 * This is a utility function to standardize simple pushes.
 * In a real app, you would typically look up the token(s) based on userId, this is purely for demo/debugging.
 */
export async function sendSimpleNotification(
    token: string,
    title: string,
    body: string
) {
    const notificationData: NotificationData = {
        type: 'general',
        title,
        body,
        data: {
            // We add a timestamp to ensure the payload is unique, which can help with delivery.
            timestamp: Date.now().toString(),
        },
    };

    return sendNotificationToTokens([token], notificationData);
}

// Send notification to multiple users
export async function sendNotificationToUsers(
    userIds: string[],
    notification: NotificationData
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
        const result = await sendNotificationToUser(userId, notification);
        if (result) {
            success++;
        } else {
            failed++;
        }
    }

    return { success, failed };
}

// Store user notification token
export async function storeUserNotificationToken(
    userId: string,
    token: string
): Promise<void> {
    try {
        // Check if token already exists
        const existingToken = await db
            .collection('userNotificationTokens')
            .where('token', '==', token)
            .get();

        if (!existingToken.empty) {
            // Update existing token
            await existingToken.docs[0].ref.update({
                userId,
                lastUsed: new Date()
            });
        } else {
            // Create new token entry
            await db.collection('userNotificationTokens').add({
                userId,
                token,
                createdAt: new Date(),
                lastUsed: new Date()
            });
        }

        console.log(`Notification token stored for user: ${userId}`);
    } catch (error) {
        console.error('Error storing notification token:', error);
        throw error;
    }
}

// Remove invalid token
async function removeInvalidToken(token: string): Promise<void> {
    try {
        const tokenDoc = await db
            .collection('userNotificationTokens')
            .where('token', '==', token)
            .get();

        if (!tokenDoc.empty) {
            await tokenDoc.docs[0].ref.delete();
            console.log(`Removed invalid token: ${token.substring(0, 20)}...`);
        }
    } catch (error) {
        console.error('Error removing invalid token:', error);
    }
}

// Get user notification tokens
export async function getUserNotificationTokens(
    userId: string
): Promise<string[]> {
    try {
        const tokensSnapshot = await db
            .collection('userNotificationTokens')
            .where('userId', '==', userId)
            .get();

        return tokensSnapshot.docs.map((doc) => doc.data().token);
    } catch (error) {
        console.error('Error getting user notification tokens:', error);
        return [];
    }
}

// Remove user notification token
export async function removeUserNotificationToken(
    userId: string,
    token: string
): Promise<void> {
    try {
        const tokenDoc = await db
            .collection('userNotificationTokens')
            .where('userId', '==', userId)
            .where('token', '==', token)
            .get();

        if (!tokenDoc.empty) {
            await tokenDoc.docs[0].ref.delete();
            console.log(`Removed notification token for user: ${userId}`);
        }
    } catch (error) {
        console.error('Error removing user notification token:', error);
        throw error;
    }
}

export { admin, db };
