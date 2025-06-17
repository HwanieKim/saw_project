'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Review, ReviewFormData } from '@/app/types';
import ReviewModal from './ReviewModal';

interface ReviewsListProps {
    reviews: Review[];
    movieId: number;
    movieTitle: string;
    onReviewUpdate: (reviewId: string, data: ReviewFormData) => void;
    onReviewDelete: (reviewId: string) => void;
    loading?: boolean;
}

export default function ReviewsList({
    reviews,
    movieId,
    movieTitle,
    onReviewUpdate,
    onReviewDelete,
    loading = false,
}: ReviewsListProps) {
    const { user } = useAuth();
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEditReview = (review: Review) => {
        setEditingReview(review);
        setIsModalOpen(true);
    };

    const handleDeleteReview = (reviewId: string) => {
        if (confirm('Are you sure you want to delete this review?')) {
            onReviewDelete(reviewId);
        }
    };

    const handleModalSubmit = (data: ReviewFormData) => {
        if (editingReview) {
            onReviewUpdate(editingReview.id, data);
        }
        setIsModalOpen(false);
        setEditingReview(null);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingReview(null);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <span
                        key={star}
                        className={`text-sm ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                        ★
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4">Reviews</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-gray-800 rounded-lg p-4 animate-pulse">
                            <div className="flex justify-between items-start mb-2">
                                <div className="h-4 bg-gray-700 rounded w-32"></div>
                                <div className="h-4 bg-gray-700 rounded w-20"></div>
                            </div>
                            <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-700 rounded w-full"></div>
                                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4">
                Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <p>No reviews yet. Be the first to review this movie!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-gray-800 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">
                                        {review.displayName}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-400 text-sm">
                                        {formatDate(review.timestamp)}
                                    </span>
                                </div>
                                {user && review.userId === user.uid && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                handleEditReview(review)
                                            }
                                            className="text-sm text-indigo-400 hover:text-indigo-300">
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteReview(review.id)
                                            }
                                            className="text-sm text-red-400 hover:text-red-300">
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                {renderStars(review.rating)}
                                <span className="text-sm text-gray-400 ml-2">
                                    {review.rating}/10
                                </span>
                            </div>

                            <p className="text-gray-300 leading-relaxed">
                                {review.reviewText}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <ReviewModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                initialData={
                    editingReview
                        ? {
                              rating: editingReview.rating,
                              reviewText: editingReview.reviewText,
                          }
                        : undefined
                }
                isEditing={true}
            />
        </div>
    );
}
