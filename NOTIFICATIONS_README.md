# CineShelf Notification System

This document describes the comprehensive notification system implemented for CineShelf, a movie social platform.

## Overview

The notification system uses Firebase Cloud Messaging (FCM) to send push notifications to users across different platforms. It includes both backend services and frontend components for a complete notification experience.

## Architecture

### Backend Components

1. **Firebase Admin Configuration** (`src/firebase/admin.ts`)

    - Handles Firebase Admin SDK initialization
    - Manages notification token storage and retrieval
    - Provides core notification sending functions

2. **Notification Service** (`src/firebase/notificationService.ts`)

    - Contains specific notification functions for different types
    - Manages user notification preferences
    - Handles bulk notifications

3. **API Endpoints** (`src/app/api/notifications/`)
    - Token management (`/api/notifications/token`)
    - Preferences management (`/api/notifications/preferences`)
    - Specific notification types:
        - Movie reviews (`/api/notifications/movie-review`)
        - Friend requests (`/api/notifications/friend-request`)
        - Watchlist updates (`/api/notifications/watchlist-update`)
        - Recommendations (`/api/notifications/recommendation`)
        - Bulk notifications (`/api/notifications/bulk`)

### Frontend Components

1. **Notification Hook** (`src/hooks/useNotifications.ts`)

    - Manages notification state and permissions
    - Handles token registration and preferences
    - Provides notification utilities

2. **Notification Settings** (`src/components/NotificationSettings.tsx`)

    - Complete notification preferences UI
    - Permission management
    - User-friendly settings interface

3. **Notification Bell** (`src/components/NotificationBell.tsx`)
    - Navbar notification indicator
    - Quick access to notification status
    - Visual feedback for notification state

## Notification Types

### 1. Movie Review Notifications

-   **Trigger**: When a user reviews a movie
-   **Recipients**: Users who have the movie in their watchlist
-   **Content**: Reviewer name, movie title, rating, and review text

### 2. Friend Request Notifications

-   **Trigger**: When a user sends or accepts a friend request
-   **Recipients**: The target user
-   **Content**: Requester name and action (request/accepted)

### 3. Watchlist Update Notifications

-   **Trigger**: When a friend adds a movie to their watchlist
-   **Recipients**: User's friends
-   **Content**: Friend name, movie title, and action

### 4. Movie Recommendation Notifications

-   **Trigger**: When a user recommends a movie to another user
-   **Recipients**: The recommended user
-   **Content**: Recommender name, movie title, and optional reason

### 5. General Notifications

-   **Trigger**: System announcements or important updates
-   **Recipients**: All users or specific users
-   **Content**: Custom title and body

## Database Schema

### User Notification Tokens

```typescript
interface UserNotificationToken {
    userId: string;
    token: string;
    createdAt: Date;
    lastUsed: Date;
    platform?: 'web' | 'android' | 'ios';
}
```

### User Notification Preferences

```typescript
interface NotificationPreferences {
    movieReviews: boolean;
    friendRequests: boolean;
    watchlistUpdates: boolean;
    recommendations: boolean;
    general: boolean;
}
```

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Firebase Config (already in your project)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side notifications)
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

# VAPID Key for Web Push Notifications
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

## Usage Examples

### Sending a Movie Review Notification

```typescript
import { sendMovieReviewNotificationWithPreference } from '@/firebase/notificationService';

// In your review submission handler
await sendMovieReviewNotificationWithPreference(
    reviewerId,
    movieId,
    movieTitle,
    reviewerName,
    rating,
    reviewText
);
```

### Sending a Friend Request Notification

```typescript
import { sendFriendRequestNotification } from '@/firebase/notificationService';

// When sending a friend request
await sendFriendRequestNotification(requesterId, requesterName, recipientId);
```

### Using the Notification Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
    const {
        isSupported,
        permission,
        isEnabled,
        requestPermission,
        updatePreferences,
    } = useNotifications();

    const handleEnableNotifications = async () => {
        const success = await requestPermission();
        if (success) {
            console.log('Notifications enabled!');
        }
    };

    return (
        <div>
            {!isEnabled && (
                <button onClick={handleEnableNotifications}>
                    Enable Notifications
                </button>
            )}
        </div>
    );
}
```

### Adding Notification Bell to Navbar

```typescript
import NotificationBell from '@/components/NotificationBell';

function Navbar() {
    return (
        <nav>
            {/* Other navbar items */}
            <NotificationBell />
        </nav>
    );
}
```

## API Endpoints

### Token Management

**POST** `/api/notifications/token`

-   Store a new notification token
-   Body: `{ userId, token, platform }`

**DELETE** `/api/notifications/token`

-   Remove a notification token
-   Body: `{ userId, token }`

**GET** `/api/notifications/token?userId=123`

-   Get user's notification tokens

### Preferences Management

**GET** `/api/notifications/preferences?userId=123`

-   Get user's notification preferences

**PUT** `/api/notifications/preferences`

-   Update user's notification preferences
-   Body: `{ userId, preferences }`

### Specific Notifications

**POST** `/api/notifications/movie-review`

-   Send movie review notification
-   Body: `{ reviewerId, movieId, movieTitle, reviewerName, rating, reviewText }`

**POST** `/api/notifications/friend-request`

-   Send friend request notification
-   Body: `{ type: 'request' | 'accepted', requesterId, requesterName, recipientId, accepterId?, accepterName? }`

**POST** `/api/notifications/watchlist-update`

-   Send watchlist update notification
-   Body: `{ userId, userName, movieId, movieTitle, friendIds }`

**POST** `/api/notifications/recommendation`

-   Send movie recommendation notification
-   Body: `{ recommenderId, recommenderName, recipientId, movieId, movieTitle, reason? }`

**POST** `/api/notifications/bulk`

-   Send bulk notification to all users
-   Body: `{ title, body, data? }`

## Security Considerations

1. **Token Validation**: Invalid tokens are automatically removed from the database
2. **User Authentication**: All API endpoints should verify user authentication
3. **Rate Limiting**: Consider implementing rate limiting for notification endpoints
4. **Data Privacy**: Only send notifications to users who have opted in

## Error Handling

The system includes comprehensive error handling:

-   Invalid tokens are automatically cleaned up
-   Failed notifications are logged for debugging
-   User preferences are respected before sending notifications
-   Graceful fallbacks when services are unavailable

## Testing

To test the notification system:

1. **Enable notifications** in your browser
2. **Register a notification token** using the hook
3. **Send test notifications** using the API endpoints
4. **Verify delivery** in the browser console and notification tray

## Troubleshooting

### Common Issues

1. **Notifications not showing**: Check browser permissions and service worker registration
2. **Tokens not being stored**: Verify Firebase Admin SDK configuration
3. **Notifications not sending**: Check VAPID key configuration and Firebase project settings

### Debug Steps

1. Check browser console for errors
2. Verify service worker is registered (`/firebase-messaging-sw.js`)
3. Confirm Firebase configuration is correct
4. Test with a simple notification first

## Future Enhancements

1. **Notification History**: Store and display past notifications
2. **Rich Notifications**: Include images and action buttons
3. **Scheduled Notifications**: Send notifications at specific times
4. **Notification Analytics**: Track delivery and engagement rates
5. **Cross-platform Support**: Extend to mobile apps

## Support

For issues or questions about the notification system, check:

1. Firebase Console for FCM configuration
2. Browser developer tools for service worker issues
3. Server logs for backend notification errors
