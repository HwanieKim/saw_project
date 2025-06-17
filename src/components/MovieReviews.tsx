'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Review, ReviewFormData } from '@/app/types';
import ReviewsList from './ReviewsList';

interface MovieReviewsProps {
    movieId: number;
    movieTitle: string;
}

export default function MovieReviews({
    movieId,
    movieTitle,
}: MovieReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
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
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [movieId]);

    const handleReviewUpdate = async (
        reviewId: string,
        data: ReviewFormData
    ) => {
        try {
            const { updateDoc, doc } = await import('firebase/firestore');
            const reviewRef = doc(db, 'reviews', reviewId);
            await updateDoc(reviewRef, {
                rating: data.rating,
                reviewText: data.reviewText,
                timestamp: new Date(),
            });

            // Update local state
            setReviews((prevReviews) =>
                prevReviews.map((review) =>
                    review.id === reviewId
                        ? {
                              ...review,
                              rating: data.rating,
                              reviewText: data.reviewText,
                              timestamp: new Date(),
                          }
                        : review
                )
            );
        } catch (error) {
            console.error('Error updating review:', error);
            alert('Failed to update review');
        }
    };

    const handleReviewDelete = async (reviewId: string) => {
        try {
            const { deleteDoc, doc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'reviews', reviewId));

            // Update local state
            setReviews((prevReviews) =>
                prevReviews.filter((review) => review.id !== reviewId)
            );
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review');
        }
    };

    return (
        <ReviewsList
            reviews={reviews}
            movieId={movieId}
            movieTitle={movieTitle}
            onReviewUpdate={handleReviewUpdate}
            onReviewDelete={handleReviewDelete}
            loading={loading}
        />
    );
}
