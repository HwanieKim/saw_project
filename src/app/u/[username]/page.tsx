'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
} from 'firebase/firestore';
import { UserProfile } from '@/app/types';
import Link from 'next/link';
import ReviewModal from '@/components/ReviewModal';
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from 'firebase/storage';
import Image from 'next/image';

interface MovieReview {
    id: string;
    movieId: string;
    movieTitle: string;
    moviePoster: string;
    rating: number;
    review: string;
    createdAt: Date;
}

interface FollowerUser {
    uid: string;
    displayName: string;
    email: string;
}

export default function UserProfilePage() {
    const params = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [reviews, setReviews] = useState<MovieReview[]>([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [followersList, setFollowersList] = useState<FollowerUser[]>([]);
    const [followingList, setFollowingList] = useState<FollowerUser[]>([]);
    const [followersLoading, setFollowersLoading] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);
    const [editingReview, setEditingReview] = useState<MovieReview | null>(
        null
    );
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const isOwnProfile =
        currentUser && profile && currentUser.uid === profile.uid;
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const username = params.username as string;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Find user by displayName
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('displayName', '==', username));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setLoading(false);
                    return;
                }

                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();

                const profileData: UserProfile = {
                    uid: userDoc.id,
                    displayName: userData.displayName,
                    email: userData.email,
                    bio: userData.bio || '',
                    followers: userData.followers || [],
                    following: userData.following || [],
                    createdAt: userData.createdAt?.toDate() || new Date(),
                };

                setProfile(profileData);

                // Parallel data fetching for better performance
                const [currentUserDoc] = await Promise.all([
                    currentUser
                        ? getDoc(doc(db, 'users', currentUser.uid))
                        : null,
                ]);

                // Fetch reviews for this profile
                fetchUserReviews(userDoc.id);

                // Check if current user is following this profile
                if (currentUser && currentUserDoc) {
                    const currentUserData = currentUserDoc.data();
                    const following = currentUserData?.following || [];
                    setIsFollowing(following.includes(profileData.uid));
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username, currentUser]);

    // Refresh following state when currentUser changes
    useEffect(() => {
        const checkFollowingState = async () => {
            if (!currentUser || !profile) return;

            try {
                const currentUserDoc = await getDoc(
                    doc(db, 'users', currentUser.uid)
                );
                const currentUserData = currentUserDoc.data();
                const following = currentUserData?.following || [];
                setIsFollowing(following.includes(profile.uid));
            } catch (error) {
                console.error('Error checking following state:', error);
            }
        };

        checkFollowingState();
    }, [currentUser, profile]);

    const fetchUserReviews = async (userId: string) => {
        try {
            const reviewsRef = collection(db, 'reviews');
            const q = query(reviewsRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            const reviewsData: MovieReview[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                reviewsData.push({
                    id: doc.id,
                    movieId: data.movieId,
                    movieTitle: data.movieTitle,
                    moviePoster: data.moviePoster,
                    rating: data.rating,
                    review: data.reviewText,
                    createdAt: data.timestamp?.toDate() || new Date(),
                });
            });

            // Sort by creation date (newest first)
            reviewsData.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );
            setReviews(reviewsData);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const fetchFollowersList = async () => {
        if (!profile || profile.followers.length === 0) return;

        setFollowersLoading(true);
        try {
            // Use batch fetching for better performance
            const batchSize = 10;
            const followersData: FollowerUser[] = [];

            for (let i = 0; i < profile.followers.length; i += batchSize) {
                const batch = profile.followers.slice(i, i + batchSize);
                const batchPromises = batch.map(async (followerId) => {
                    const followerDoc = await getDoc(
                        doc(db, 'users', followerId)
                    );
                    if (followerDoc.exists()) {
                        const data = followerDoc.data();
                        return {
                            uid: followerId,
                            displayName: data.displayName,
                            email: data.email,
                        };
                    }
                    return null;
                });

                const batchResults = await Promise.all(batchPromises);
                followersData.push(
                    ...(batchResults.filter(Boolean) as FollowerUser[])
                );
            }

            setFollowersList(followersData);
        } catch (error) {
            console.error('Error fetching followers:', error);
        } finally {
            setFollowersLoading(false);
        }
    };

    const fetchFollowingList = async () => {
        if (!profile || profile.following.length === 0) return;

        setFollowingLoading(true);
        try {
            // Use batch fetching for better performance
            const batchSize = 10;
            const followingData: FollowerUser[] = [];

            for (let i = 0; i < profile.following.length; i += batchSize) {
                const batch = profile.following.slice(i, i + batchSize);
                const batchPromises = batch.map(async (followingId) => {
                    const followingDoc = await getDoc(
                        doc(db, 'users', followingId)
                    );
                    if (followingDoc.exists()) {
                        const data = followingDoc.data();
                        return {
                            uid: followingId,
                            displayName: data.displayName,
                            email: data.email,
                        };
                    }
                    return null;
                });

                const batchResults = await Promise.all(batchPromises);
                followingData.push(
                    ...(batchResults.filter(Boolean) as FollowerUser[])
                );
            }

            setFollowingList(followingData);
        } catch (error) {
            console.error('Error fetching following:', error);
        } finally {
            setFollowingLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser || !profile) return;

        setFollowLoading(true);
        try {
            const currentUserRef = doc(db, 'users', currentUser.uid);
            const profileUserRef = doc(db, 'users', profile.uid);

            if (isFollowing) {
                // Unfollow
                await updateDoc(currentUserRef, {
                    following: arrayRemove(profile.uid),
                });
                await updateDoc(profileUserRef, {
                    followers: arrayRemove(currentUser.uid),
                });
                setIsFollowing(false);

                // Update local state immediately
                setProfile((prev) =>
                    prev
                        ? {
                              ...prev,
                              followers: prev.followers.filter(
                                  (id) => id !== currentUser.uid
                              ),
                          }
                        : null
                );
            } else {
                // Follow
                await updateDoc(currentUserRef, {
                    following: arrayUnion(profile.uid),
                });
                await updateDoc(profileUserRef, {
                    followers: arrayUnion(currentUser.uid),
                });
                setIsFollowing(true);

                // Update local state immediately
                setProfile((prev) =>
                    prev
                        ? {
                              ...prev,
                              followers: [...prev.followers, currentUser.uid],
                          }
                        : null
                );
            }
        } catch (error) {
            console.error('Error following/unfollowing:', error);
            // Revert the state if there was an error
            setIsFollowing(!isFollowing);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleFollowersClick = () => {
        if (!showFollowers) {
            fetchFollowersList();
        }
        setShowFollowers(!showFollowers);
        setShowFollowing(false);
    };

    const handleFollowingClick = () => {
        if (!showFollowing) {
            fetchFollowingList();
        }
        setShowFollowing(!showFollowing);
        setShowFollowers(false);
    };

    // Edit review handler
    const handleEditReview = (review: MovieReview) => {
        setEditingReview(review);
        setModalOpen(true);
    };

    // Update review in Firestore
    const handleReviewUpdate = async (
        reviewId: string,
        data: { rating: number; reviewText: string }
    ) => {
        setModalLoading(true);
        try {
            const reviewRef = doc(db, 'reviews', reviewId);
            await updateDoc(reviewRef, {
                rating: data.rating,
                reviewText: data.reviewText,
                timestamp: new Date(),
            });
            setEditingReview(null);
            setModalOpen(false);
            // Refresh reviews
            fetchUserReviews(profile!.uid);
        } finally {
            setModalLoading(false);
        }
    };

    // Delete review in Firestore
    const handleReviewDelete = async (reviewId: string) => {
        if (!window.confirm('Are you sure you want to delete this review?'))
            return;
        try {
            await deleteDoc(doc(db, 'reviews', reviewId));
            fetchUserReviews(profile!.uid);
        } catch {
            alert('Failed to delete review');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-32 bg-gray-800 rounded-lg mb-6"></div>
                        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">
                            User Not Found
                        </h1>
                        <p className="text-gray-400">
                            The user you&apos;re looking for doesn&apos;t exist.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="bg-gray-800 rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div
                                className="w-20 h-20 rounded-full overflow-hidden relative group cursor-pointer"
                                onClick={() =>
                                    isOwnProfile && setShowModal(true)
                                }
                                title={
                                    isOwnProfile
                                        ? 'Edit profile picture'
                                        : undefined
                                }
                                style={{ backgroundColor: '#4f46e5' }}>
                                {profile.photoURL ? (
                                    <Image
                                        src={profile.photoURL}
                                        alt="Profile"
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover transition duration-200 group-hover:brightness-75"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-white flex items-center justify-center w-full h-full">
                                        {profile.displayName
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                )}
                                {isOwnProfile && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition bg-blend-darken pointer-events-none">
                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z"
                                                />
                                            </svg>
                                            Edit
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">
                                    {profile.displayName}
                                </h1>
                                <p className="text-gray-400">{profile.email}</p>
                                {profile.bio && (
                                    <p className="text-gray-300 mt-2">
                                        {profile.bio}
                                    </p>
                                )}
                                <div className="flex space-x-6 mt-3">
                                    <button
                                        onClick={handleFollowersClick}
                                        className="text-sm text-gray-400 hover:text-white cursor-pointer">
                                        <span className="font-semibold text-white">
                                            {profile.followers.length}
                                        </span>{' '}
                                        followers
                                    </button>
                                    <button
                                        onClick={handleFollowingClick}
                                        className="text-sm text-gray-400 hover:text-white cursor-pointer">
                                        <span className="font-semibold text-white">
                                            {profile.following.length}
                                        </span>{' '}
                                        following
                                    </button>
                                </div>
                            </div>
                        </div>

                        {currentUser && currentUser.uid !== profile.uid && (
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                    isFollowing
                                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}>
                                {followLoading
                                    ? 'Loading...'
                                    : isFollowing
                                    ? 'Unfollow'
                                    : 'Follow'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Modal for uploading profile picture */}
                {showModal && isOwnProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg p-6 w-80 text-gray-900 relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                                onClick={() => setShowModal(false)}>
                                &times;
                            </button>
                            <h2 className="text-lg font-bold mb-4">
                                Change Profile Picture
                            </h2>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setSelectedFile(e.target.files?.[0] || null)
                                }
                                className="mb-4"
                                disabled={uploading}
                            />
                            <button
                                className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                                disabled={!selectedFile || uploading}
                                onClick={async () => {
                                    if (!selectedFile || !profile) return;
                                    setUploading(true);
                                    try {
                                        const storage = getStorage();
                                        const fileRef = storageRef(
                                            storage,
                                            `profilePictures/${profile.uid}`
                                        );
                                        await uploadBytes(
                                            fileRef,
                                            selectedFile
                                        );
                                        const url = await getDownloadURL(
                                            fileRef
                                        );
                                        await updateDoc(
                                            doc(db, 'users', profile.uid),
                                            { photoURL: url }
                                        );
                                        setProfile((prev) =>
                                            prev
                                                ? { ...prev, photoURL: url }
                                                : prev
                                        );
                                        setShowModal(false);
                                        setSelectedFile(null);
                                    } catch {
                                        alert(
                                            'Failed to upload profile picture.'
                                        );
                                    } finally {
                                        setUploading(false);
                                    }
                                }}>
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Followers/Following Lists */}
                {(showFollowers || showFollowing) && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">
                            {showFollowers ? 'Followers' : 'Following'}
                        </h2>
                        {showFollowers && (
                            <div>
                                {followersLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="flex items-center space-x-3 animate-pulse">
                                                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-700 rounded w-1/3 mb-1"></div>
                                                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : followersList.length > 0 ? (
                                    <div className="space-y-3">
                                        {followersList.map((user) => (
                                            <div
                                                key={user.uid}
                                                className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg">
                                                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold">
                                                        {user.displayName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <Link
                                                        href={`/u/${user.displayName}`}
                                                        className="font-semibold text-white hover:text-indigo-400">
                                                        {user.displayName}
                                                    </Link>
                                                    <p className="text-sm text-gray-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400">
                                        No followers yet.
                                    </p>
                                )}
                            </div>
                        )}
                        {showFollowing && (
                            <div>
                                {followingLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="flex items-center space-x-3 animate-pulse">
                                                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-700 rounded w-1/3 mb-1"></div>
                                                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : followingList.length > 0 ? (
                                    <div className="space-y-3">
                                        {followingList.map((user) => (
                                            <div
                                                key={user.uid}
                                                className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg">
                                                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold">
                                                        {user.displayName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <Link
                                                        href={`/u/${user.displayName}`}
                                                        className="font-semibold text-white hover:text-indigo-400">
                                                        {user.displayName}
                                                    </Link>
                                                    <p className="text-sm text-gray-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400">
                                        Not following anyone yet.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* User Reviews List */}
                <div className="mt-12">
                    <h2 className="text-2xl font-semibold mb-6">Reviews</h2>
                    {reviews.length === 0 ? (
                        <div className="text-gray-400">No reviews yet.</div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-gray-800 rounded-lg p-4 flex gap-4 items-start">
                                    <div className="w-16 h-24 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                                        {review.moviePoster ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${review.moviePoster}`}
                                                alt={review.movieTitle}
                                                className="w-full h-full object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Link
                                                    href={`/movie/${review.movieId}`}
                                                    className="font-semibold text-white hover:text-indigo-400 text-lg truncate">
                                                    {review.movieTitle}
                                                </Link>
                                                <span className="text-yellow-400 font-bold ml-2 flex items-center gap-1">
                                                    ★{' '}
                                                    <span className="ml-1">
                                                        {review.rating}/10
                                                    </span>
                                                </span>
                                                <span className="text-gray-400 text-sm ml-2">
                                                    {review.createdAt instanceof
                                                    Date
                                                        ? review.createdAt.toLocaleDateString()
                                                        : ''}
                                                </span>
                                            </div>
                                            {currentUser &&
                                                currentUser.uid ===
                                                    profile.uid && (
                                                    <div className="flex gap-2 ml-4">
                                                        <button
                                                            className="text-indigo-400 hover:underline text-sm"
                                                            onClick={() =>
                                                                handleEditReview(
                                                                    review
                                                                )
                                                            }>
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="text-red-400 hover:underline text-sm"
                                                            onClick={() =>
                                                                handleReviewDelete(
                                                                    review.id
                                                                )
                                                            }>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                        <div className="text-gray-300 text-base break-words">
                                            {review.review}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <ReviewModal
                        isOpen={modalOpen}
                        onClose={() => {
                            setModalOpen(false);
                            setEditingReview(null);
                        }}
                        onSubmit={(data) => {
                            if (editingReview) {
                                handleReviewUpdate(editingReview.id, data);
                            }
                        }}
                        loading={modalLoading}
                        initialData={
                            editingReview
                                ? {
                                      rating: editingReview.rating,
                                      reviewText: editingReview.review,
                                  }
                                : undefined
                        }
                        isEditing={!!editingReview}
                    />
                </div>
            </div>
        </div>
    );
}
