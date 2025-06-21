'use client';

import { useState } from 'react';
import { Review, ReviewFormData } from '@/app/types';
import ReviewModal from './ReviewModal';
import { useAuth } from '@/context/AuthContext';
import StarRating from './StarRating';

interface ReviewsListProps {
    reviews: Review[];
    onReviewUpdate: (reviewId: string, data: ReviewFormData) => Promise<void>;
    onReviewDelete: (reviewId: string) => Promise<void>;
    loading: boolean;
}

export default function ReviewsList({
    reviews,
    onReviewUpdate,
    onReviewDelete,
    loading,
}: ReviewsListProps) {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const handleEditReview = (review: Review) => {
        setEditingReview(review);
        setIsModalOpen(true);
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (confirm('Are you sure you want to delete this review?')) {
            try {
                await onReviewDelete(reviewId);
            } catch (error) {
                console.error('Error deleting review:', error);
            }
        }
    };

    const handleModalSubmit = async (data: ReviewFormData) => {
        if (!editingReview) return;

        setModalLoading(true);
        try {
            await onReviewUpdate(editingReview.id, data);
            setIsModalOpen(false);
            setEditingReview(null);
        } catch (error) {
            console.error('Error updating review:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingReview(null);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="bg-gray-700 rounded h-4 w-24 mb-1"></div>
                                    <div className="bg-gray-700 rounded h-3 w-16"></div>
                                </div>
                            </div>
                            <div className="bg-gray-700 rounded h-4 w-full mb-2"></div>
                            <div className="bg-gray-700 rounded h-3 w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            {reviews.length > 0 && (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {review.displayName
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">
                                            {review.displayName}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {new Date(
                                                review.timestamp
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {user && user.uid === review.userId && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                handleEditReview(review)
                                            }
                                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteReview(review.id)
                                            }
                                            className="text-sm text-red-400 hover:text-red-300 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <StarRating
                                    value={review.rating}
                                    interactive={false}
                                    showValue={false}
                                    size="sm"
                                />
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
        </>
    );
}
