//src/components/ActionButtons.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import {
    doc,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    setDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
} from 'firebase/firestore';
import { Review, ReviewFormData } from '@/app/types';
import ReviewModal from './ReviewModal';

interface ActionButtonsProps {
    movieId: number;
    movieTitle: string;
    onReviewsUpdate?: (reviews: Review[]) => void;
}

export default function ActionButtons({
    movieId,
    movieTitle,
    onReviewsUpdate,
}: ActionButtonsProps) {
    const { user } = useAuth();
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [userReview, setUserReview] = useState<Review | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const watchListRef = doc(db, 'watchlists', user.uid);
        const removeFromWatchlist = onSnapshot(
            watchListRef,
            (docSnapshot) => {
                setLoading(false);
                if (docSnapshot.exists()) {
                    const watchlistData = docSnapshot.data();
                    if (
                        watchlistData &&
                        Array.isArray(watchlistData.movieIds)
                    ) {
                        setIsInWatchlist(
                            watchlistData.movieIds.includes(movieId)
                        );
                    }
                } else {
                    setIsInWatchlist(false);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error listening to watchlist:', error);
                setLoading(false);
                setIsInWatchlist(false);
            }
        );

        // Check if user has already reviewed this movie
        const checkUserReview = async () => {
            try {
                const reviewsRef = collection(db, 'reviews');
                const q = query(
                    reviewsRef,
                    where('userId', '==', user.uid),
                    where('movieId', '==', movieId),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const reviewDoc = querySnapshot.docs[0];
                    setUserReview({
                        id: reviewDoc.id,
                        ...reviewDoc.data(),
                    } as Review);
                }
            } catch (error) {
                console.error('Error checking user review:', error);
            }
        };

        checkUserReview();

        return () => removeFromWatchlist();
    }, [user, movieId]);

    const handleWatchlistToggle = async () => {
        if (!user) return alert('Please log In first to manage your watchlist');
        setLoading(true);
        const watchlistRef = doc(db, 'watchlists', user.uid);
        try {
            await setDoc(
                watchlistRef,
                {
                    movieIds: isInWatchlist
                        ? arrayRemove(movieId)
                        : arrayUnion(movieId),
                },
                { merge: true }
            );
        } catch (error) {
            console.error('Error updating Watchlist', error);
            alert('Failed to update Watchlist');
        }
    };

    const handleReviewSubmit = async (data: ReviewFormData) => {
        if (!user) return;

        setReviewLoading(true);
        try {
            const reviewsRef = collection(db, 'reviews');
            const reviewData = {
                userId: user.uid,
                movieId: movieId,
                movieTitle: movieTitle,
                rating: data.rating,
                reviewText: data.reviewText,
                displayName: user.displayName || 'Anonymous',
                timestamp: new Date(),
            };

            const docRef = await addDoc(reviewsRef, reviewData);
            const newReview = { id: docRef.id, ...reviewData } as Review;
            setUserReview(newReview);
            setIsReviewModalOpen(false);

            // Update reviews list if callback provided
            if (onReviewsUpdate) {
                // Fetch updated reviews
                const updatedReviewsQuery = query(
                    collection(db, 'reviews'),
                    where('movieId', '==', movieId),
                    orderBy('timestamp', 'desc')
                );
                const querySnapshot = await getDocs(updatedReviewsQuery);
                const reviews = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Review[];
                onReviewsUpdate(reviews);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review');
        } finally {
            setReviewLoading(false);
        }
    };

    const getReviewButtonText = () => {
        if (userReview) {
            return `Edit Review (${userReview.rating}/10)`;
        }
        return 'Leave a Review';
    };

    if (loading && user) {
        return (
            <div className="h-12 w-full bg-gray-700 rounded-lg animate-pulse mt-8"></div>
        );
    }

    return (
        <>
            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={handleWatchlistToggle}
                    disabled={!user}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors w-48 text-center disabled:bg-gray-500 disabled:cursor-not-allowed ${
                        isInWatchlist
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}>
                    {isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
                </button>
                <button
                    onClick={() => setIsReviewModalOpen(true)}
                    disabled={!user}
                    className="px-6 py-3 bg-gray-600 rounded-lg font-semibold hover:bg-gray-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {getReviewButtonText()}
                </button>
            </div>

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onSubmit={handleReviewSubmit}
                loading={reviewLoading}
                initialData={
                    userReview
                        ? {
                              rating: userReview.rating,
                              reviewText: userReview.reviewText,
                          }
                        : undefined
                }
                isEditing={!!userReview}
            />
        </>
    );
}
