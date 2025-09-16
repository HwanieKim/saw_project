'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Review, ReviewFormData } from '@/app/types';
import ReviewsList from './ReviewsList';
import { useAuth } from '@/context/AuthContext';
import ReviewModal from './ReviewModal';
import { addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';


interface MovieReviewsProps {
    movieId: number;
    moviePoster: string | null;
    movieTitle: string;
    onReviewsUpdate?: (reviews: Review[]) => void;
}

export default function MovieReviews({
    movieId,
    moviePoster,
    movieTitle,
    onReviewsUpdate,
}: MovieReviewsProps) {
    const { user, userProfile } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);

    // Find the current user's review
    const userReview = user ? reviews.find((r) => r.userId === user.uid) : null;

    // Calculate average rating and review count
    const reviewCount = reviews.length;
    const averageRating =
        reviewCount > 0
            ? (
                  reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                  reviewCount
              ).toFixed(1)
            : null;

    const fetchReviews = useCallback(async () => {
        try {
            const reviewsRef = collection(db, 'reviews');
            const q = query(
                reviewsRef,
                where('movieId', '==', movieId),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const reviewsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Review[];
            setReviews(reviewsData);
            if (onReviewsUpdate) {
                onReviewsUpdate(reviewsData);
            }
        } finally {
            setLoading(false);
        }
    }, [movieId, onReviewsUpdate]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Handle new review submission
    const handleReviewSubmit = async (data: ReviewFormData) => {
        if (!user || !userProfile) return;
        setModalLoading(true);
        try {
            await Promise.all([
                // review save
                addDoc(collection(db, 'reviews'), {
                    userId: user.uid,
                    displayName:
                        userProfile?.displayName || user.email || 'User',
                    movieId,
                    movieTitle,
                    moviePoster,
                    rating: data.rating,
                    reviewText: data.reviewText,
                    timestamp: new Date(),
                }),
                // Notify followers
                (async () => {
                    const followersRef = collection(
                        db,
                        'users',
                        user.uid,
                        'followers'
                    );
                    const followersSnapshot = await getDocs(followersRef);
                    const followerIds = followersSnapshot.docs.map(
                        (doc) => doc.id
                    );

                    if (followerIds.length > 0) {
                        await fetch('/api/notifications/followed-user-review', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                reviewerId: user.uid,
                                movieId: movieId,
                                movieTitle: movieTitle,
                                rating: data.rating,
                                followerIds: followerIds,
                            }),
                        });
                    }
                })(),
            ]);

            setModalOpen(false);
            await fetchReviews(); // Refresh reviews after adding
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setModalLoading(false);
        }
    };

    // Handle review update
    const handleReviewUpdate = async (
        reviewId: string,
        data: ReviewFormData
    ) => {
        setModalLoading(true);
        try {
            const reviewRef = doc(db, 'reviews', reviewId);
            await updateDoc(reviewRef, {
                rating: data.rating,
                reviewText: data.reviewText,
                moviePoster,
                movieTitle,
                timestamp: new Date(),
            });
            setEditingReview(null);
            setModalOpen(false);
            await fetchReviews();
        } finally {
            setModalLoading(false);
        }
    };

    // Handle review delete
    const handleReviewDelete = async (reviewId: string) => {
        try {
            await deleteDoc(doc(db, 'reviews', reviewId));
            await fetchReviews();
        } catch {
            alert('Failed to delete review');
        }
    };

    const publicReviews = reviews.filter((r) => !user || r.userId !== user.uid);
    const showNoReviews = publicReviews.length === 0 && (!user || !userReview);

    return (
        <div className="mt-12">
            <div className="flex items-center gap-6 mb-6">
                <h2 className="text-2xl font-semibold">Reviews</h2>
                {averageRating && (
                    <span className="text-lg text-yellow-400 font-bold">
                        ★ {averageRating} / 10
                    </span>
                )}
                <span className="text-gray-400">
                    {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </span>
            </div>
            {user && !userReview && (
                <button
                    className="mb-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    onClick={() => setModalOpen(true)}>
                    Leave a Review
                </button>
            )}
            {user && userReview && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-indigo-600">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-indigo-300">
                            Your Review
                        </span>
                        <div className="flex gap-2">
                            <button
                                className="text-sm text-indigo-400 hover:underline"
                                onClick={() => {
                                    setEditingReview(userReview);
                                    setModalOpen(true);
                                }}>
                                Edit
                            </button>
                            <button
                                className="text-sm text-red-400 hover:underline"
                                onClick={() =>
                                    handleReviewDelete(userReview.id)
                                }>
                                Delete
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 font-bold">
                            ★ {userReview.rating}
                        </span>
                        <span className="text-gray-400 text-sm">
                            {userReview.timestamp &&
                                (userReview.timestamp instanceof Date
                                    ? userReview.timestamp.toLocaleDateString()
                                    : typeof userReview.timestamp ===
                                          'object' &&
                                      'seconds' in userReview.timestamp
                                    ? new Date(
                                          (userReview.timestamp as Timestamp)
                                              .seconds * 1000
                                      ).toLocaleDateString()
                                    : '')}
                        </span>
                    </div>
                    <div className="text-gray-200 text-base">
                        {userReview.reviewText}
                    </div>
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
                    } else {
                        handleReviewSubmit(data);
                    }
                }}
                loading={modalLoading}
                initialData={
                    editingReview
                        ? {
                              rating: editingReview.rating,
                              reviewText: editingReview.reviewText,
                          }
                        : undefined
                }
                isEditing={!!editingReview}
            />
            <ReviewsList
                reviews={publicReviews}
                onReviewUpdate={handleReviewUpdate}
                onReviewDelete={handleReviewDelete}
                loading={loading}
            />
            {showNoReviews && (
                <div className="text-center py-8">
                    <p className="text-gray-400 text-lg mb-4">
                        No reviews yet. Be the first to share your thoughts!
                    </p>
                </div>
            )}
        </div>
    );
}
