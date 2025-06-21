import {
    sendNotificationToUser,
    sendNotificationToUsers,
    NotificationData,
    storeUserNotificationToken,
    getUserNotificationTokens,
    removeUserNotificationToken,
} from './admin';
import { db } from './admin';

// Movie review notification
export async function sendMovieReviewNotification(
    reviewerId: string,
    movieId: string,
    movieTitle: string,
    reviewerName: string,
    rating: number,
    reviewText: string
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

        await sendNotificationToUsers(filteredUserIds, notification);
        console.log(
            `Sent movie review notification to ${filteredUserIds.length} users`
        );
    } catch (error) {
        console.error('Error sending movie review notification:', error);
    }
}

// Friend request notification
export async function sendFriendRequestNotification(
    requesterId: string,
    requesterName: string,
    recipientId: string
): Promise<void> {
    try {
        const notification: NotificationData = {
            type: 'friend_request',
            title: 'New Friend Request',
            body: `${requesterName} wants to be your friend on CineShelf`,
            data: {
                requesterId,
                requesterName,
                type: 'friend_request',
            },
        };

        await sendNotificationToUser(recipientId, notification);
        console.log(`Sent friend request notification to user: ${recipientId}`);
    } catch (error) {
        console.error('Error sending friend request notification:', error);
    }
}

// Friend request accepted notification
export async function sendFriendRequestAcceptedNotification(
    accepterId: string,
    accepterName: string,
    requesterId: string
): Promise<void> {
    try {
        const notification: NotificationData = {
            type: 'friend_request',
            title: 'Friend Request Accepted',
            body: `${accepterName} accepted your friend request`,
            data: {
                accepterId,
                accepterName,
                type: 'friend_request_accepted',
            },
        };

        await sendNotificationToUser(requesterId, notification);
        console.log(
            `Sent friend request accepted notification to user: ${requesterId}`
        );
    } catch (error) {
        console.error(
            'Error sending friend request accepted notification:',
            error
        );
    }
}

// Watchlist update notification (when a friend adds a movie to watchlist)
export async function sendWatchlistUpdateNotification(
    userId: string,
    userName: string,
    movieId: string,
    movieTitle: string,
    friendIds: string[]
): Promise<void> {
    try {
        if (friendIds.length === 0) return;

        const notification: NotificationData = {
            type: 'watchlist_update',
            title: 'Watchlist Update',
            body: `${userName} added "${movieTitle}" to their watchlist`,
            data: {
                userId,
                userName,
                movieId,
                movieTitle,
                type: 'watchlist_update',
            },
        };

        await sendNotificationToUsers(friendIds, notification);
        console.log(
            `Sent watchlist update notification to ${friendIds.length} friends`
        );
    } catch (error) {
        console.error('Error sending watchlist update notification:', error);
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

        await sendNotificationToUser(recipientId, notification);
        console.log(
            `Sent movie recommendation notification to user: ${recipientId}`
        );
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
            data: data || {},
        };

        await sendNotificationToUser(userId, notification);
        console.log(`Sent general notification to user: ${userId}`);
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
    friendRequests: boolean;
    watchlistUpdates: boolean;
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
            friendRequests: true,
            watchlistUpdates: true,
            recommendations: true,
            general: true,
        };
    } catch (error) {
        console.error('Error getting user notification preferences:', error);
        return {
            movieReviews: true,
            friendRequests: true,
            watchlistUpdates: true,
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
    rating: number,
    reviewText: string
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
        console.log(
            `Sent movie review notification to ${usersToNotify.length} users (with preferences)`
        );
    } catch (error) {
        console.error(
            'Error sending movie review notification with preference:',
            error
        );
    }
}

// Export the token management functions
export {
    storeUserNotificationToken,
    getUserNotificationTokens,
    removeUserNotificationToken,
};
