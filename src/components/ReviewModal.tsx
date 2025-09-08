'use client';

import { useEffect, useState } from 'react';
import { ReviewFormData } from '@/app/types';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ReviewFormData) => void;
    loading?: boolean;
    initialData?: ReviewFormData;
    isEditing?: boolean;
}

export default function ReviewModal({
    isOpen,
    onClose,
    onSubmit,
    loading = false,
    initialData,
    isEditing = false,
}: ReviewModalProps) {
    const [formData, setFormData] = useState<ReviewFormData>(
        initialData || { rating: 0, reviewText: '' }
    );
    const [hoveredRating, setHoveredRating] = useState(0);

    useEffect(() => {
        if (isOpen) { 
            //reset form data when modal opens
            if (initialData) {
                setFormData({
                    rating: initialData.rating,
                    reviewText: initialData.reviewText,
                });
            } else {
                setFormData({ rating: 0, reviewText: '' });
            }
        }
        // only run when modal opens or initialData changes
    }, [isOpen, initialData]);

    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.rating === 0) {
            alert('Please select a rating');
            return;
        }
        if (formData.reviewText.trim().length < 10) {
            alert('Review must be at least 10 characters long');
            return;
        }
        onSubmit(formData);
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({ rating: 0, reviewText: '' });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">
                        {isEditing ? 'Edit Review' : 'Leave a Review'}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-white disabled:opacity-50">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Rating *
                        </label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            rating: star,
                                        })
                                    }
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="text-2xl transition-colors">
                                    <span
                                        className={
                                            star <=
                                            (hoveredRating || formData.rating)
                                                ? 'text-yellow-400'
                                                : 'text-gray-400'
                                        }>
                                        ★
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                            <span className="text-yellow-400 font-bold ml-2 flex items-center gap-1">
                                ★
                                <span className="ml-1">
                                    {formData.rating}/10
                                </span>
                            </span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Review *
                        </label>
                        <textarea
                            value={formData.reviewText}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    reviewText: e.target.value,
                                })
                            }
                            placeholder="Share your thoughts about this movie..."
                            className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            required
                            minLength={10}
                            disabled={loading}
                        />
                        <p className="text-sm text-gray-400 mt-1">
                            {formData.reviewText.length}/500 characters (minimum
                            10)
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                loading ||
                                formData.rating === 0 ||
                                formData.reviewText.trim().length < 10
                            }
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                            {loading
                                ? 'Saving...'
                                : isEditing
                                ? 'Update Review'
                                : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
