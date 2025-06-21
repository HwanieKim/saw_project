// src/components/WatchlistButton.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    WatchlistMovie,
} from '@/firebase/watchlist';

interface WatchlistButtonProps {
    movie: WatchlistMovie;
}

export default function WatchlistButton({ movie }: WatchlistButtonProps) {
    const { user } = useAuth();
    const [inWatchlist, setInWatchlist] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!user) return;
        let isMounted = true;
        isInWatchlist(user.uid, movie.movieId).then((exists) => {
            if (isMounted) setInWatchlist(exists);
        });
        return () => {
            isMounted = false;
        };
    }, [user, movie.movieId]);

    const handleClick = async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (inWatchlist) {
                await removeFromWatchlist(user.uid, movie.movieId);
                setInWatchlist(false);
            } else {
                await addToWatchlist(user.uid, movie);
                setInWatchlist(true);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update watchlist.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <button
                className="px-6 py-3 bg-gray-500 text-white rounded-lg cursor-not-allowed"
                disabled>
                Login to use Watchlist
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500
        ${
            inWatchlist
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }
        ${loading ? 'opacity-60 cursor-wait' : ''}`}>
            {loading
                ? 'Updating...'
                : inWatchlist
                ? 'Remove from Watchlist'
                : 'Add to Watchlist'}
        </button>
    );
}
