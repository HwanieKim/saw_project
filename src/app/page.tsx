// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { db } from '@/firebase/config';
import {
    collection,
    query as firestoreQuery,
    where,
    getDocs,
    limit,
} from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
interface SearchResult {
    type: 'movie' | 'user';
    id: string;
    title?: string;
    name?: string;
    posterPath?: string | null;
    releaseDate?: string;
    displayName?: string;
    email?: string;
}

interface MovieResult {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
}

interface UserData {
    displayName: string;
    email: string;
}

export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Use the debouncer on the user's query
    const debouncedQuery = useDebounce(searchQuery, 300);

    // Effect to fetch search results when the debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        let isCancelled = false;
        setIsLoading(true);
        setSearchResults([]);

        const performSearch = async () => {
            const results: SearchResult[] = [];

            try {
                // Parallel search for better performance
                const [userSnapshot, movieResponse] = await Promise.all([
                    // Search for users
                    (async () => {
                        const usersRef = collection(db, 'users');
                        const userQuery = firestoreQuery(
                            usersRef,
                            where('displayName', '>=', debouncedQuery),
                            where(
                                'displayName',
                                '<=',
                                debouncedQuery + '\uf8ff'
                            ),
                            limit(3)
                        );
                        return getDocs(userQuery);
                    })(),
                    // Search for movies
                    fetch(
                        `/api/search?query=${encodeURIComponent(
                            debouncedQuery
                        )}`
                    ),
                ]);

                // Process user results
                if (!isCancelled) {
                    userSnapshot.forEach((doc) => {
                        const data = doc.data() as UserData;
                        results.push({
                            type: 'user',
                            id: doc.id,
                            displayName: data.displayName,
                            email: data.email,
                        });
                    });

                    // Process movie results
                    if (movieResponse.ok) {
                        const movieData = await movieResponse.json();
                        const movies = movieData.results?.slice(0, 3) || [];
                        movies.forEach((movie: MovieResult) => {
                            results.push({
                                type: 'movie',
                                id: movie.id.toString(),
                                title: movie.title,
                                posterPath: movie.poster_path,
                                releaseDate: movie.release_date,
                            });
                        });
                    }
                }
            } catch (error) {
                console.error('Search error:', error);
            }

            if (!isCancelled) {
                setSearchResults(results);
                setIsLoading(false);
            }
        };

        performSearch();

        return () => {
            isCancelled = true;
        };
    }, [debouncedQuery]);

    // Effect to handle clicking outside the search box to close results
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node)
            ) {
                setSearchResults([]);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        router.push(`/search-results?query=${encodeURIComponent(searchQuery)}`);
    };

    const handleResultClick = (result: SearchResult) => {
        if (result.type === 'movie') {
            router.push(`/movie/${result.id}`);
        } else {
            router.push(`/u/${result.displayName}`);
        }
        setSearchResults([]);
        setSearchQuery('');
    };

    return (
        <div className="space-y-12">
            {/* Hero Section with Search */}
            <section className="text-center py-12">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    Welcome to CineShelf
                </h1>
                <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                    Discover, review, and share your favorite movies with
                    friends. Build your personal movie collection and get
                    personalized recommendations.
                </p>

                {/* Search Form with Results Dropdown */}
                <div
                    ref={searchContainerRef}
                    className="max-w-lg mx-auto relative">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for movies or users..."
                            className="flex-grow p-3 border border-gray-700 rounded-md text-white bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                            disabled={!searchQuery.trim()}>
                            Search
                        </button>
                    </form>

                    {/* Search Results Dropdown */}
                    {(isLoading || searchResults.length > 0) && (
                        <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                            {isLoading && (
                                <p className="text-center text-gray-400 p-4">
                                    Loading...
                                </p>
                            )}
                            {!isLoading && searchResults.length > 0 && (
                                <div>
                                    {searchResults.map((result) => (
                                        <div
                                            key={`${result.type}-${result.id}`}
                                            onClick={() =>
                                                handleResultClick(result)
                                            }
                                            className="flex items-center p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0">
                                            {result.type === 'movie' ? (
                                                <>
                                                    <div className="w-12 h-16 bg-gray-700 rounded mr-3 flex-shrink-0">
                                                        {result.posterPath && (
                                                            <Image
                                                                src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                                                                alt={
                                                                    result.title ||
                                                                    'Movie poster'
                                                                }
                                                                width={92}
                                                                height={138}
                                                                className="w-full h-full object-cover rounded"
                                                                unoptimized
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-white truncate">
                                                            {result.title}
                                                        </p>
                                                        <p className="text-sm text-gray-400">
                                                            {result.releaseDate?.substring(
                                                                0,
                                                                4
                                                            ) || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                                                        Movie
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 bg-indigo-600 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white font-bold">
                                                            {result.displayName
                                                                ?.charAt(0)
                                                                .toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-white truncate">
                                                            {result.displayName}
                                                        </p>
                                                        <p className="text-sm text-gray-400 truncate">
                                                            {result.email}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-500 bg-indigo-700 px-2 py-1 rounded">
                                                        User
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!isLoading &&
                                searchResults.length === 0 &&
                                searchQuery.trim().length >= 2 && (
                                    <p className="text-center text-gray-400 p-4">
                                        No results found
                                    </p>
                                )}
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="text-center py-8">
                <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    <Link
                        href="/discover"
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Discover Movies
                    </Link>
                    <a
                        href="/my-lists"
                        className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        My watchlist
                    </a>
                    <a
                        href="/search-results?query=trending"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Trending Now
                    </a>
                </div>
            </section>
        </div>
    );
}
