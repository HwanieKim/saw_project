// src/app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Image from 'next/image';

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

export default function Navbar() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const debouncedQuery = useDebounce(searchQuery, 300);
    const searchRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check if we're on the home page
    const isHomePage = pathname === '/';
    const isAuthPage = pathname === '/login' || pathname === '/register';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (debouncedQuery.trim().length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const performSearch = async () => {
            setSearchLoading(true);
            const results: SearchResult[] = [];

            try {
                // Search for users
                const usersRef = collection(db, 'users');
                const userQuery = query(
                    usersRef,
                    where('displayName', '>=', debouncedQuery),
                    where('displayName', '<=', debouncedQuery + '\uf8ff'),
                    limit(3)
                );
                const userSnapshot = await getDocs(userQuery);
                userSnapshot.forEach((doc) => {
                    const data = doc.data();
                    results.push({
                        type: 'user',
                        id: doc.id,
                        displayName: data.displayName,
                        email: data.email,
                    });
                });

                // Search for movies
                const movieResponse = await fetch(
                    `/api/search?query=${encodeURIComponent(debouncedQuery)}`
                );
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
            } catch (error) {
                console.error('Search error:', error);
            }

            setSearchResults(results);
            setShowResults(true);
            setSearchLoading(false);
        };

        performSearch();
    }, [debouncedQuery]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Error in logout :', error);
        }
    };

    const handleResultClick = (result: SearchResult) => {
        if (result.type === 'movie') {
            router.push(`/movie/${result.id}`);
        } else {
            router.push(`/u/${result.displayName}`);
        }
        setShowResults(false);
        setSearchQuery('');
    };

    return (
        <nav className="bg-gray-800 text-white h-20 shadow-md">
            <div className="container mx-auto flex items-center justify-between h-full">
                <div className="flex items-center space-x-8">
                    <Link
                        href="/"
                        className="text-2xl font-bold hover:text-indigo-400">
                        CineShelf
                    </Link>

                    {/* Navigation Links */}
                    {user && (
                        <div className="flex items-center space-x-6">
                            <Link
                                href="/discover"
                                className="text-gray-300 hover:text-white transition-colors">
                                Discover
                            </Link>
                            <Link
                                href="/recommendations"
                                className="text-gray-300 hover:text-white transition-colors">
                                Recommendations
                            </Link>
                            <Link
                                href="/social-feed"
                                className="text-gray-300 hover:text-white transition-colors">
                                Social Feed
                            </Link>
                        </div>
                    )}
                </div>

                {/* Search Bar - Only show if not on home page */}
                {!isHomePage && !isAuthPage && mounted && (
                    <div
                        ref={searchRef}
                        className="relative flex-1 max-w-md mx-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (searchQuery.trim()) {
                                    router.push(
                                        `/search-results?query=${encodeURIComponent(
                                            searchQuery
                                        )}`
                                    );
                                    setShowResults(false);
                                    // setSearchQuery(''); // Optionally clear input
                                }
                            }}
                            className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search movies or users..."
                                className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                🔍
                            </div>
                            {searchLoading && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                                </div>
                            )}
                            {/* Search Results Dropdown */}
                            {showResults && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                                    {searchResults.length > 0 ? (
                                        <div>
                                            {searchResults.map((result) => (
                                                <div
                                                    key={`${result.type}-${result.id}`}
                                                    onClick={() =>
                                                        handleResultClick(
                                                            result
                                                        )
                                                    }
                                                    className="flex items-center p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0">
                                                    {result.type === 'movie' ? (
                                                        <>
                                                            <div className="w-12 h-16 bg-gray-600 rounded mr-3 flex-shrink-0">
                                                                {result.posterPath && (
                                                                    <Image
                                                                        src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                                                                        alt={
                                                                            result.title ||
                                                                            'Movie poster'
                                                                        }
                                                                        width={
                                                                            92
                                                                        }
                                                                        height={
                                                                            138
                                                                        }
                                                                        className="w-full h-full object-cover rounded"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold">
                                                                    {
                                                                        result.title
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    {
                                                                        result.releaseDate
                                                                    }
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3 text-lg font-bold">
                                                                {
                                                                    result
                                                                        .displayName?.[0]
                                                                }
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold">
                                                                    {
                                                                        result.displayName
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    {
                                                                        result.email
                                                                    }
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 text-gray-400">
                                            No results found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                    {user && userProfile && (
                        <Link
                            href={`/u/${userProfile.displayName}`}
                            className="ml-4 flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors overflow-hidden border-2 border-indigo-400"
                            title="Profile">
                            {userProfile.photoURL ? (
                                <Image
                                    src={userProfile.photoURL}
                                    alt="Profile"
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-bold text-lg">
                                    {userProfile.displayName
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </span>
                            )}
                        </Link>
                    )}
                    {user ? (
                        <>
                            <Link
                                href="/my-lists"
                                className="hover:text-indigo-400">
                                My watchlist
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
                                Logout
                            </button>
                        </>
                    ) : loading ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="hover:text-indigo-400">
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="hover:text-indigo-400">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
