'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getWatchlist, WatchlistMovie } from '@/firebase/watchlist';
import Image from 'next/image';
import Link from 'next/link';

interface Movie {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
}

export default function RecommendationsPage() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
    const [recommendations, setRecommendations] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getWatchlist(user.uid)
            .then((movies) => setWatchlist(movies))
            .finally(() => setLoading(false));
    }, [user]);

    useEffect(() => {
        if (!user || watchlist.length === 0) return;
        setLoading(true);
        setError(null);
        fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieIds: watchlist.map((m) => m.movieId) }),
        })
            .then((res) => res.json())
            .then((data) => {
                setRecommendations(data.results || []);
            })
            .catch(() => setError('Failed to fetch recommendations.'))
            .finally(() => setLoading(false));
    }, [user, watchlist]);

    if (!user) {
        return (
            <div className="text-center mt-16 text-lg text-gray-400">
                Please log in to view recommendations.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center mt-16 text-lg text-gray-400">
                Loading recommendations...
            </div>
        );
    }

    if (watchlist.length === 0) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-3xl font-bold mb-6">Recommendations</h1>
                <p className="text-gray-400 mb-6">
                    Your watchlist is empty. Add movies to your watchlist to get
                    personalized recommendations!
                </p>
                <Link href="/discover">
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Go to Discover
                    </button>
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center mt-16 text-lg text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Recommendations</h1>
            {recommendations.length === 0 ? (
                <div className="text-center text-gray-400 mt-12 text-lg">
                    No recommendations found. Try adding more movies to your
                    watchlist!
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {recommendations.map((movie) => (
                        <Link
                            key={movie.id}
                            href={`/movie/${movie.id}`}
                            className="group block bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                            <div className="relative w-full aspect-[2/3] bg-gray-700">
                                {movie.poster_path ? (
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                        alt={movie.title || 'Movie poster'}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <div className="font-semibold text-white truncate">
                                    {movie.title}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
