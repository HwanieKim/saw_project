//src/components/SearchBar.tsx
// Search bar component with debounced movie search functionality
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import SearchPrieview from './SearchPrieview';

interface SearchResult {
    id: number;
    title: string;
    posterPath: string | null;
    releaseDate: string;
}

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)  //contains take node as argument 
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
            setResults([]);
            setShowResults(false);
            return;
        }

        const searchMovies = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/search?query=${encodeURIComponent(debouncedQuery)}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setResults(data.results || []);
                    setShowResults(true);
                }
            } catch (error) {
                console.error('Error searching movies:', error);
            } finally {
                setLoading(false);
            }
        };

        searchMovies();
    }, [debouncedQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleInputFocus = () => {
        if (results.length > 0) {
            setShowResults(true);
        }
    };

    const handleResultClick = () => {
        setShowResults(false);
        setQuery('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search-results?query=${encodeURIComponent(query)}`);
            setShowResults(false);
            setQuery('');
        }
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder="Search for movies..."
                    className="w-full px-4 py-3 pl-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                </div>
                {loading && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                    </div>
                )}
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                        <div>
                            {results.slice(0, 8).map((movie) => (
                                <div key={movie.id} onClick={handleResultClick}>
                                    <SearchPrieview
                                        movie={{
                                            id: movie.id,
                                            title: movie.title,
                                            posterPath: movie.posterPath,
                                            releaseDate: movie.releaseDate,
                                        }}
                                    />
                                </div>
                            ))}
                            {results.length > 8 && (
                                <div className="p-3 text-center border-t border-gray-600">
                                    <button
                                        onClick={handleSubmit}
                                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                                        View all {results.length} results
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-400">
                            No movies found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
