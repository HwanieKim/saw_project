//src/firebase/notificationService.ts
// High-level notification service functions for different notification types
import {
    sendNotificationToUser,
    sendNotificationToUsers,
    NotificationData,
    storeUserNotificationToken,
    getUserNotificationTokens,
    removeUserNotificationToken,
} from './admin';
import { db } from './admin';

/**
 * Stores a notification in a user's subcollection.
 */
export async function storeNotification(
    userId: string,
    notification: NotificationData
): Promise<void> {
    try {
        const userNotificationsRef = db
            .collection('users')
            .doc(userId)
            .collection('notifications');
        await userNotificationsRef.add({
            ...notification,
            createdAt: new Date(),
            isRead: false,
        });
    } catch (error) {
        console.error(
            `Failed to store notification for user ${userId}:`,
            error
        );
        // We don't re-throw the error because failing to store the notification
        // shouldn't prevent the push notification from being sent.
    }
}

// Movie review notification
export async function sendMovieReviewNotification(
    reviewerId: string,
    movieId: string,
    movieTitle: string,
    reviewerName: string,
    rating: number
): Promise<void> {
    try {
        // Get users who have this movie in their watchlist
        const watchlistSnapshot = await db
            .collection('watchlists')
            .where('movieId', '==', movieId)
            .get();

        const userIds = watchlistSnapshot.docs.map((doc) => doc.data().userId);

        // Remove the reviewer from the list
        const filteredUserIds = userIds.filter((id) => id !== reviewerId);

        if (filteredUserIds.length === 0) return;

        const notification: NotificationData = {
            type: 'movie_review',
            title: `New Review: ${movieTitle}`,
            body: `${reviewerName} rated "${movieTitle}" ${rating}/5 stars`,
            data: {
                movieId,
                reviewerId,
                rating: rating.toString(),
                type: 'movie_review',
            },
            imageUrl: `https://image.tmdb.org/t/p/w500/${movieId}`, // You'll need to get the actual poster path
        };

        const pushResults = await sendNotificationToUsers(
            filteredUserIds,
            notification
        );
        for (const userId of filteredUserIds) {
            await storeNotification(userId, notification);
        }

        console.log(
            `Movie review notification stored for ${filteredUserIds.length} users. Push notifications sent: ${pushResults.success} successful, ${pushResults.failed} failed.`
        );
    } catch (error) {
        console.error('Error sending movie review notification:', error);
    }
}

// Follower gained notification
export async function sendFollowerGainedNotification(
    followerId: string,
    followerName: string,
    followedUserId: string
): Promise<void> {
    try {
        const notification: NotificationData = {
            type: 'follower_gained',
            title: 'New Follower',
            body: `${followerName} started following you`,
            data: {
                followerId,
                followerName,
                type: 'follower_gained',
            },
        };

        const pushSent = await sendNotificationToUser(
            followedUserId,
            notification
        );
        await storeNotification(followedUserId, notification);

        if (pushSent) {
            console.log(
                `Sent push and stored in-app notification for user: ${followedUserId}`
            );
        } else {
            console.log(
                `Stored in-app notification for user ${followedUserId} (no push notification sent).`
            );
        }
    } catch (error) {
        console.error('Error sending follower gained notification:', error);
    }
}

// Followed user reviewed movie notification
export async function sendFollowedUserReviewNotification(
    reviewerId: string,
    reviewerName: string,
    movieId: string,
    movieTitle: string,
    rating: number,
    followerIds: string[]
): Promise<void> {
    try {
        if (followerIds.length === 0) return;

        const notification: NotificationData = {
            type: 'followed_user_review',
            title: `${reviewerName} reviewed ${movieTitle}`,
            body: `${reviewerName} rated "${movieTitle}" ${rating}/5 stars`,
            data: {
                reviewerId,
                reviewerName,
                movieId,
                movieTitle,
                rating: rating.toString(),
                type: 'followed_user_review',
            },
        };

        const pushResults = await sendNotificationToUsers(
            followerIds,
            notification
        );
        for (const followerId of followerIds) {
            await storeNotification(followerId, notification);
        }

        console.log(
            `Followed user review notification stored for ${followerIds.length} followers. Push notifications sent: ${pushResults.success} successful, ${pushResults.failed} failed.`
        );
    } catch (error) {
        console.error(
            'Error sending followed user review notification:',
            error
        );
    }
}

// Movie recommendation notification
export async function sendMovieRecommendationNotification(
    recommenderId: string,
    recommenderName: string,
    recipientId: string,
    movieId: string,
    movieTitle: string,
    reason?: string
): Promise<void> {
    try {
        const notification: NotificationData = {
            type: 'recommendation',
            title: 'Movie Recommendation',
            body: reason
                ? `${recommenderName} thinks you'll love "${movieTitle}" - ${reason}`
                : `${recommenderName} recommended "${movieTitle}" to you`,
            data: {
                recommenderId,
                recommenderName,
                movieId,
                movieTitle,
                reason: reason || '',
                type: 'recommendation',
            },
        };

        const pushSent = await sendNotificationToUser(
            recipientId,
            notification
        );
        await storeNotification(recipientId, notification);

        if (pushSent) {
            console.log(
                `Sent push and stored in-app notification for user: ${recipientId}`
            );
        } else {
            console.log(
                `Stored in-app notification for user ${recipientId} (no push notification sent).`
            );
        }
    } catch (error) {
        console.error(
            'Error sending movie recommendation notification:',
            error
        );
    }
}

// General notification
export async function sendGeneralNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<void> {
    try {
        const notification: NotificationData = {
            type: 'general',
            title,
            body,
            data: {
                ...data,
                type: 'general',
            },
        };

        const pushSent = await sendNotificationToUser(userId, notification);
        await storeNotification(userId, notification);

        if (pushSent) {
            console.log(
                `Sent push and stored in-app general notification for user: ${userId}`
            );
        } else {
            console.log(
                `Stored in-app general notification for user ${userId} (no push notification sent).`
            );
        }
    } catch (error) {
        console.error('Error sending general notification:', error);
    }
}

// Bulk notification to all users (for announcements)
export async function sendBulkNotification(
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ success: number; failed: number }> {
    try {
        // Get all unique user IDs from notification tokens
        const tokensSnapshot = await db
            .collection('userNotificationTokens')
            .get();

        const userIds = [
            ...new Set(tokensSnapshot.docs.map((doc) => doc.data().userId)),
        ];

        const notification: NotificationData = {
            type: 'general',
            title,
            body,
            data: data || {},
        };

        const result = await sendNotificationToUsers(userIds, notification);
        console.log(`Sent bulk notification to ${userIds.length} users`);
        return result;
    } catch (error) {
        console.error('Error sending bulk notification:', error);
        return { success: 0, failed: 0 };
    }
}

// Notification preferences management
export interface NotificationPreferences {
    movieReviews: boolean;
    followerGained: boolean;
    followedUserReviews: boolean;
    recommendations: boolean;
    general: boolean;
}

// Get user notification preferences
export async function getUserNotificationPreferences(
    userId: string
): Promise<NotificationPreferences> {
    try {
        const prefsDoc = await db
            .collection('userNotificationPreferences')
            .doc(userId)
            .get();

        if (prefsDoc.exists) {
            return prefsDoc.data() as NotificationPreferences;
        }

        // Return default preferences
        return {
            movieReviews: true,
            followerGained: true,
            followedUserReviews: true,
            recommendations: true,
            general: true,
        };
    } catch (error) {
        console.error('Error getting user notification preferences:', error);
        return {
            movieReviews: true,
            followerGained: true,
            followedUserReviews: true,
            recommendations: true,
            general: true,
        };
    }
}

// Update user notification preferences
export async function updateUserNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
): Promise<void> {
    try {
        await db
            .collection('userNotificationPreferences')
            .doc(userId)
            .set(preferences, { merge: true });

        console.log(`Updated notification preferences for user: ${userId}`);
    } catch (error) {
        console.error('Error updating user notification preferences:', error);
        throw error;
    }
}

// Check if user has enabled a specific notification type
export async function isNotificationEnabled(
    userId: string,
    type: keyof NotificationPreferences
): Promise<boolean> {
    try {
        const preferences = await getUserNotificationPreferences(userId);
        return preferences[type];
    } catch (error) {
        console.error('Error checking notification preference:', error);
        return true; // Default to enabled if there's an error
    }
}

// Enhanced notification functions with preference checking
export async function sendMovieReviewNotificationWithPreference(
    reviewerId: string,
    movieId: string,
    movieTitle: string,
    reviewerName: string,
    rating: number
): Promise<void> {
    try {
        const watchlistSnapshot = await db
            .collection('watchlists')
            .where('movieId', '==', movieId)
            .get();

        const userIds = watchlistSnapshot.docs.map((doc) => doc.data().userId);
        const filteredUserIds = userIds.filter((id) => id !== reviewerId);

        if (filteredUserIds.length === 0) return;

        // Check preferences for each user
        const usersToNotify: string[] = [];
        for (const userId of filteredUserIds) {
            if (await isNotificationEnabled(userId, 'movieReviews')) {
                usersToNotify.push(userId);
            }
        }

        if (usersToNotify.length === 0) return;

        const notification: NotificationData = {
            type: 'movie_review',
            title: `New Review: ${movieTitle}`,
            body: `${reviewerName} rated "${movieTitle}" ${rating}/5 stars`,
            data: {
                movieId,
                reviewerId,
                rating: rating.toString(),
                type: 'movie_review',
            },
        };

        await sendNotificationToUsers(usersToNotify, notification);
        for (const userId of usersToNotify) {
            await storeNotification(userId, notification);
        }

        console.log(
            `Sent and stored movie review notification to ${usersToNotify.length} users (with preferences)`
        );
    } catch (error) {
        console.error(
            'Error sending movie review notification with preference:',
            error
        );
    }
}

// Export the token management functions
export { getUserNotificationTokens, removeUserNotificationToken };
