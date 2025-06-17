// src/app/my-lists/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Movie } from '../types';
import MovieCard from '@/components/MovieCard';
import Link from 'next/link';

export default function MyListPage() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.uid) {
            setLoading(false);
            setWatchlist([]);
            return;
        }
        const fetchWatchlist = async () => {
            setLoading(true);
            try {
                const watchlistRef = doc(db, 'watchlists', user.uid);
                const docSnap = await getDoc(watchlistRef);

                if (docSnap.exists()) {
                    const movieIds = docSnap.data().movieIds || [];

                    const moviePromises = movieIds.map((id: number) =>
                        fetch(`/api/movie/${id}`).then((res) => res.json())
                    );

                    const moviesData = await Promise.all(moviePromises);
                    setWatchlist(moviesData.filter((movie) => movie));
                }
            } catch (error) {
                console.error('failed to fetch watchlist', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWatchlist();
    }, [user]);

    if (loading) {
        return <p>Loading your lists...</p>;
    }

    if (!user) {
        return (
            <p>
                Please{' '}
                <Link href="/login" className="underline">
                    login
                </Link>{' '}
                to see your lists.
            </p>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
            {watchlist.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {watchlist.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            ) : (
                <p>Your watchlist is empty. Find a movie and add it!</p>
            )}
        </div>
    );
}
