// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useDebounce from '@/hooks/useDebouce'; // Import our new hook
import MovieCard from '@/components/MovieCard'
import { Movie } from './types';
// Define the type for a single preview item


export default function HomePage() {
    const [query, setQuery] = useState('');
    const [previews, setPreviews] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Use the debouncer on the user's query
    const debouncedQuery = useDebounce(query, 300);

    // Effect to fetch previews when the debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim()) {
            setIsLoading(true);
            setPreviews([]);

            const fetchPreviews = async () => {
                try {
                    const response = await fetch(
                        `/api/search?query=${encodeURIComponent(
                            debouncedQuery
                        )}`
                    );
                    const data = await response.json();
                    if (data && Array.isArray(data.results)) {
                       const filteredPreviews= data.results.filter(
                        (movie:Movie) => movie.poster_path
                       )
                       setPreviews(filteredPreviews.slice(0,5))
                    }
                } catch (error) {
                    console.error('Failed to fetch search previews:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPreviews();
        } else {
            setPreviews([]); // Clear previews if the search bar is empty
        }
    }, [debouncedQuery]);

    // Effect to handle clicking outside the search box to close previews
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node)
            ) {
                setPreviews([]); // Clear previews
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/search-results?query=${encodeURIComponent(query)}`);
    };

    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-bold">Welcome to CineShelf</h1>
                <p className="text-lg text-gray-400 mt-1">
                    Discover, review, and share your favorite movies with
                    friends.
                </p>

                {/* Search Form with Preview Dropdown */}
                <div
                    ref={searchContainerRef}
                    className="mt-6 max-w-lg relative">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for The Godfather..."
                            className="flex-grow p-3 border border-gray-700 rounded-md text-white bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                            disabled={!query.trim()}>
                            Search
                        </button>
                    </form>

                    {/* Preview Dropdown */}
                    {(isLoading || previews.length > 0) && (
                        <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 p-2">
                            {isLoading && (
                                <p className="text-center text-gray-400 p-2">
                                    Loading...
                                </p>
                            )}
                            {!isLoading &&
                                previews.map((movie) => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        variant='preview'
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Other dashboard sections can remain here */}
            {/* ... */}
        </div>
    );
}
