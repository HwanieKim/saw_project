// src/app/my-lists/page.tsx
// This page displays the current user's watchlist using Firestore and AuthContext.
// Citation: https://firebase.google.com/docs/firestore/query-data/get-data#get_multiple_documents_from_a_collection
// Citation: https://react.dev/reference/react/useEffect
// Citation: https://react.dev/reference/react/useState

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    getWatchlist,
    WatchlistMovie,
    removeFromWatchlist,
} from '@/firebase/watchlist';
import Image from 'next/image';
import Link from 'next/link';

export default function MyListsPage() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
    const [loading, setLoading] = useState(true);

    console.log('Current user:', user);

    // Fetch the user's watchlist on mount
    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getWatchlist(user.uid)
            .then((movies) => setWatchlist(movies))
            .finally(() => setLoading(false));
    }, [user]);

    if (!user) {
        return (
            <div className="text-center mt-16 text-lg text-gray-400">
                Please log in to view your watchlist.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center mt-16 text-lg text-gray-400">
                Loading your watchlist...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
            {watchlist.length === 0 ? (
                <div className="text-center text-gray-400 mt-12 text-lg">
                    Your watchlist is empty. Start adding movies!
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {watchlist.map((movie) => (
                        <Link
                            key={movie.movieId}
                            href={`/movie/${movie.movieId}`}
                            className="group block bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow relative">
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await removeFromWatchlist(
                                        user.uid,
                                        movie.movieId
                                    );
                                    setWatchlist((prev) =>
                                        prev.filter(
                                            (m) => m.movieId !== movie.movieId
                                        )
                                    );
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                title="Remove from watchlist">
                                &times;
                            </button>
                            <div className="relative w-full aspect-[2/3] bg-gray-700">
                                {movie.posterPath ? (
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w342${movie.posterPath}`}
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
