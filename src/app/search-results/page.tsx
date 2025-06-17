// src/app/search-results/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/app/types';

type SortOrder = 'popularity' | 'release_date' | 'rating';

export default function SearchResultsPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query');

    const [results, setResults] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>('popularity');

    useEffect(() => {
        if (!query) {
            setLoading(false);
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `/api/search?query=${encodeURIComponent(query)}`
                );
                const data = await response.json();

                if (!response.ok) {
                    // Use the error message from our newly fixed API route
                    throw new Error(
                        data.message || 'The search request failed.'
                    );
                }

                if (data && Array.isArray(data.results)) {
                    // Use the correct 'snake_case' property to filter
                    const filteredResults = data.results.filter(
                        (movie: Movie) => movie.poster_path
                    );
                    setResults(filteredResults);
                } else {
                    throw new Error(
                        'Received an invalid response format from the server.'
                    );
                }
            } catch (err: unknown) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'An unknown error occurred.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    const sortedResults = useMemo(() => {
        const sorted = [...results];
        switch (sortOrder) {
            case 'release_date':
                return sorted.sort(
                    (a, b) =>
                        new Date(b.release_date).getTime() -
                        new Date(a.release_date).getTime()
                );
            case 'rating':
                return sorted.sort((a, b) => b.vote_average - a.vote_average);
            default:
                return results;
        }
    }, [results, sortOrder]);

    if (loading) {
        return (
            <div className="text-center text-xl mt-10">
                Loading results for `{query}`...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-2">
                Search Results for `{query}`
            </h1>

            <div className="flex items-center gap-2 md:gap-4 mb-8">
                <span className="font-semibold text-sm md:text-base">
                    Sort by:
                </span>
                <div>
                    <button
                        onClick={() => setSortOrder('popularity')}
                        className={`px-3 py-1 rounded-full text-xs md:text-sm transition-colors ${
                            sortOrder === 'popularity'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600'
                        }`}>
                        Popularity
                    </button>
                    <button
                        onClick={() => setSortOrder('release_date')}
                        className={`ml-2 px-3 py-1 rounded-full text-xs md:text-sm transition-colors ${
                            sortOrder === 'release_date'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600'
                        }`}>
                        Newest
                    </button>
                    <button
                        onClick={() => setSortOrder('rating')}
                        className={`ml-2 px-3 py-1 rounded-full text-xs md:text-sm transition-colors ${
                            sortOrder === 'rating'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600'
                        }`}>
                        Top Rated
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-center text-lg">{error}</p>
            )}

            {!error && sortedResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {sortedResults.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-400 mt-10 text-lg">
                    No results found for `{query}`. Please try another search
                    term.
                </p>
            )}
        </div>
    );
}
