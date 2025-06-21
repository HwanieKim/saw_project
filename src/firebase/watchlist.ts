// src/firebase/watchlist.ts
// Firestore watchlist utilities for CineShelf
// This file provides functions to add, remove, check, and fetch movies in a user's watchlist using a Firestore subcollection.
// Each user's watchlist is stored at /users/{uid}/watchlist/{movieId} for scalability and easy querying.
// We store movieId, title, and posterPath for fast display and robustness.

import { db } from './config';
import {
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    getDocs,
    collection,
} from 'firebase/firestore';

// Type for a movie in the watchlist
export interface WatchlistMovie {
    movieId: string;
    title: string;
    posterPath: string | null;
}

/*
 * Add a movie to the user's watchlist.
 */
export async function addToWatchlist(userId: string, movie: WatchlistMovie) {
    const ref = doc(db, 'users', userId, 'watchlist', movie.movieId);
    await setDoc(ref, movie);
}

/*
 * Remove a movie from the user's watchlist.
 */
export async function removeFromWatchlist(userId: string, movieId: string) {
    const ref = doc(db, 'users', userId, 'watchlist', movieId);
    await deleteDoc(ref);
}

/*
 * Check if a movie is in the user's watchlist.
 */
export async function isInWatchlist(
    userId: string,
    movieId: string
): Promise<boolean> {
    const ref = doc(db, 'users', userId, 'watchlist', movieId);
    const snap = await getDoc(ref);
    return snap.exists();
}

/*
 * Get all movies in the user's watchlist.
 */
export async function getWatchlist(userId: string): Promise<WatchlistMovie[]> {
    const ref = collection(db, 'users', userId, 'watchlist');
    const snap = await getDocs(ref);
    return snap.docs.map((doc) => doc.data() as WatchlistMovie);
}
