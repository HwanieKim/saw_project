'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

interface Review {
    id: string;
    userId: string;
    userName: string;
    movieId: string;
    movieTitle: string;
    moviePoster: string | null;
    rating: number;
    reviewText: string;
    timestamp: Date;
}

export default function SocialFeedPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            const reviewsRef = collection(db, 'reviews');
            const q = query(
                reviewsRef,
                orderBy('timestamp', 'desc'),
                limit(20)
            );
            const querySnapshot = await getDocs(q);
            const reviewsData: Review[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                reviewsData.push({
                    id: doc.id,
                    userId: data.userId,
                    userName: data.userName || data.displayName || 'User',
                    movieId: data.movieId,
                    movieTitle: data.movieTitle,
                    moviePoster: data.moviePoster,
                    rating: data.rating,
                    reviewText: data.reviewText,
                    timestamp: data.timestamp?.toDate() || new Date(),
                });
            });
            setReviews(reviewsData);
            setLoading(false);
        };
        fetchReviews();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Recent Reviews</h1>
            {loading ? (
                <div className="text-center text-gray-400 mt-12 text-lg">
                    Loading feed...
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center text-gray-400 mt-12 text-lg">
                    No recent reviews found.
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-gray-800 rounded-lg p-4 flex gap-4 items-start">
                            <div className="w-16 h-24 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                                {review.moviePoster ? (
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w92${review.moviePoster}`}
                                        alt={review.movieTitle}
                                        width={92}
                                        height={138}
                                        className="w-full h-full object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Link
                                        href={`/u/${review.userName}`}
                                        className="font-semibold text-white hover:text-indigo-400">
                                        {review.userName}
                                    </Link>
                                    <span className="text-xs text-gray-400">
                                        • {review.timestamp.toLocaleString()}
                                    </span>
                                </div>
                                <Link
                                    href={`/movie/${review.movieId}`}
                                    className="font-bold text-indigo-400 hover:underline">
                                    {review.movieTitle}
                                </Link>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-yellow-400 font-bold">
                                        ★ {review.rating}
                                    </span>
                                </div>
                                <p className="text-gray-200 mt-2 whitespace-pre-line">
                                    {review.reviewText}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
