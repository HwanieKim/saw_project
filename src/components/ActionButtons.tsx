//src/components/ActionButtons.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

interface ActionButtonsProps {
    movieId: number;
    movieTitle: string;
    posterPath: string | null;
    releaseDate: string | null;
    voteAverage: number | null;
}

export default function ActionButtons({
    movieId,
    movieTitle,
    posterPath,
    releaseDate,
    voteAverage,
}: ActionButtonsProps) {
    const { user } = useAuth();
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Listen to the user's watchlist subcollection for this movie
        const watchlistDocRef = doc(
            db,
            'users',
            user.uid,
            'watchlist',
            String(movieId)
        );
        const unsubscribe = onSnapshot(
            watchlistDocRef,
            (docSnapshot) => {
                setLoading(false);
                setIsInWatchlist(docSnapshot.exists());
            },
            (error) => {
                console.error('Error listening to watchlist:', error);
                setLoading(false);
                setIsInWatchlist(false);
            }
        );

        return () => unsubscribe();
    }, [user, movieId]);

    const handleWatchlistToggle = async () => {
        if (!user) return alert('Please log In first to manage your watchlist');
        setLoading(true);
        const watchlistDocRef = doc(
            db,
            'users',
            user.uid,
            'watchlist',
            String(movieId)
        );
        try {
            if (isInWatchlist) {
                await deleteDoc(watchlistDocRef);
                setIsInWatchlist(false);
            } else {
                await setDoc(watchlistDocRef, {
                    movieId: String(movieId),
                    title: movieTitle,
                    posterPath: posterPath || null,
                    releaseDate: releaseDate || null,
                    voteAverage: voteAverage ?? null,
                });
                setIsInWatchlist(true);
            }
        } catch (error) {
            console.error('Error updating Watchlist', error);
            alert('Failed to update Watchlist');
        } finally {
            setLoading(false);
        }
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
            </div>
        </>
    );
}
