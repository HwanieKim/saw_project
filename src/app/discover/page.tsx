'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Movie, Genre } from '@/app/types';
import MovieCard from '@/components/MovieCard';
import StarRating from '@/components/StarRating';

// Type definitions for component props and state
type SortOption = 'popularity' | 'rating' | 'release_date' | 'title';
type ViewMode = 'grid' | 'list';

export default function DiscoverPage() {
    // Core state for movies and loading
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter and category states
    const [activeCategory, setActiveCategory] = useState('trending');
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);

    // UI and display preferences
    const [sortBy, setSortBy] = useState<SortOption>('popularity');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Advanced filter states
    const [minRating, setMinRating] = useState<number>(0);
    const [yearRange, setYearRange] = useState<{ min: number; max: number }>({
        min: 1900,
        max: new Date().getFullYear(),
    });

    const categories = [
        { id: 'trending', name: 'Trending Now', icon: '🔥' },
        { id: 'popular', name: 'Popular', icon: '⭐' },
        { id: 'top-rated', name: 'Top Rated', icon: '🏆' },
        { id: 'upcoming', name: 'Upcoming', icon: '📅' },
        { id: 'now-playing', name: 'Now Playing', icon: '🎬' },
    ];

    const sortOptions = [
        { value: 'popularity', label: 'Popularity' },
        { value: 'rating', label: 'Rating' },
        { value: 'release_date', label: 'Release Date' },
        { value: 'title', label: 'Title' },
    ];

    // Fetch available genres from TMDB API via nextjs API 
    // This is called once on component mount to populate genre filter options
    const fetchGenres = async () => {
        try {
            const response = await fetch('/api/genres');
            if (response.ok) {
                const data = await response.json();
                setGenres(data.genres);
            }
        } catch (error) {
            console.error('Error fetching genres:', error);
        }
    };

    // Load genres on component mount
    useEffect(() => {
        fetchGenres();
    }, []);

    
    // useCallback to prevent infinite re-renders dependencies
    const fetchMovies = useCallback(
        async (reset: boolean = false) => {
            if (reset) {
                setLoading(true);
                setPage(1); // Reset to first page
            }

            try {
                // Build API endpoint with category and pagination
                let endpoint = `/api/movies/${activeCategory}?page=${
                    reset ? 1 : page
                }`;

                // Add genre filters if any are selected
                if (selectedGenres.length > 0) {
                    endpoint += `&genre=${selectedGenres.join(',')}`;
                }

                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    const newMovies = data.results || [];

                    if (reset) {
                        // Fresh data - replace existing movies
                        setMovies(newMovies);
                    } else {
                        // Pagination - append to existing movies
                        setMovies((prev) => [...prev, ...newMovies]);
                    }

                    // Check if there are more pages (TMDB typically returns 20 per page)
                    setHasMore(newMovies.length === 20);
                }
            } catch (error) {
                console.error('Error fetching movies:', error);
            } finally {
                setLoading(false);
            }
        },
        [activeCategory, selectedGenres, page]
    );

    // Trigger fresh data fetch when filters change
    // Resets page to 1 and clears movies before fetching new data
    useEffect(() => {
        setPage(1);
        setMovies([]);
        fetchMovies(true); // Reset = true for fresh data
    }, [
        activeCategory,
        selectedGenres,
        sortBy,
        minRating,
        yearRange,
        fetchMovies,
    ]);

    // Handle pagination - load more movies when page changes
    // Only fetches if page > 1 (not the initial page)
    useEffect(() => {
        if (page > 1) {
            fetchMovies(false); // Reset = false to append data
        }
    }, [page, fetchMovies]);

    // Event handler: Change movie category (trending, popular, etc.)
    // Also clears genre selections since they're category-specific
    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
        setSelectedGenres([]); // Clear genre filters when changing category
    };

    // Event handler: Toggle genre filter on/off
    // Adds genre if not selected, removes if already selected
    const handleGenreToggle = (genreId: number) => {
        setSelectedGenres(
            (prev) =>
                prev.includes(genreId)
                    ? prev.filter((id) => id !== genreId) // Remove genre
                    : [...prev, genreId] // Add genre
        );
    };

    // Event handler: Load more movies (pagination)
    // Increments page number which triggers useEffect to fetch more data
    const handleLoadMore = () => {
        setPage((prev) => prev + 1);
    };

    // Memoized computation for client-side filtering and sorting
    // Uses useMemo to prevent recalculation on every render
    // Dependencies: [movies, minRating, yearRange, sortBy] - recalculates when these change
    const filteredAndSortedMovies = useMemo(() => {
        return movies
            .filter((movie) => {
                // Apply rating filter
                const rating = movie.vote_average || 0;
                // Extract year from release date string (YYYY-MM-DD format)
                const year = parseInt(
                    movie.release_date?.substring(0, 4) || '0'
                );

                // Return movies that meet all filter criteria
                return (
                    rating >= minRating &&
                    year >= yearRange.min &&
                    year <= yearRange.max
                );
            })
            .sort((a, b) => {
                // Sort by selected criteria
                switch (sortBy) {
                    case 'rating':
                        // Highest rating first
                        return (b.vote_average || 0) - (a.vote_average || 0);
                    case 'release_date':
                        // Newest first
                        return (
                            new Date(b.release_date || 0).getTime() -
                            new Date(a.release_date || 0).getTime()
                        );
                    case 'title':
                        // Alphabetical order
                        return a.title.localeCompare(b.title);
                    default:
                        // Keep original order (popularity from API)
                        return 0;
                }
            });
    }, [movies, minRating, yearRange, sortBy]);
    
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Discover Movies</h1>
                    <div className="flex items-center gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1 rounded-md transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}>
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1 rounded-md transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}>
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(e.target.value as SortOption)
                            }
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Categories */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Categories</h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() =>
                                    handleCategoryChange(category.id)
                                }
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                    activeCategory === category.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}>
                                <span>{category.icon}</span>
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="mb-8 space-y-6">
                    {/* Genres Filter */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Genres</h2>
                        <div className="flex flex-wrap gap-2">
                            {genres.map((genre) => (
                                <button
                                    key={genre.id}
                                    onClick={() => handleGenreToggle(genre.id)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        selectedGenres.includes(genre.id)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}>
                                    {genre.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating and Year Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Minimum Rating
                            </label>
                            <div className="flex items-center gap-3">
                                <StarRating
                                    value={minRating}
                                    onChange={setMinRating}
                                    maxRating={10}
                                    size="md"
                                    interactive={true}
                                    showValue={true}
                                />
                                {minRating > 0 && (
                                    <button
                                        onClick={() => setMinRating(0)}
                                        className="text-sm text-gray-400 hover:text-white transition-colors">
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Year Range
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1900"
                                    max={yearRange.max}
                                    value={yearRange.min}
                                    onChange={(e) =>
                                        setYearRange((prev) => ({
                                            ...prev,
                                            min:
                                                parseInt(e.target.value) ||
                                                1900,
                                        }))
                                    }
                                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-20"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="number"
                                    min={yearRange.min}
                                    max={new Date().getFullYear()}
                                    value={yearRange.max}
                                    onChange={(e) =>
                                        setYearRange((prev) => ({
                                            ...prev,
                                            max:
                                                parseInt(e.target.value) ||
                                                new Date().getFullYear(),
                                        }))
                                    }
                                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                        {categories.find((c) => c.id === activeCategory)?.name}
                        {selectedGenres.length > 0 && (
                            <span className="text-gray-400 ml-2">
                                -{' '}
                                {selectedGenres
                                    .map(
                                        (id) =>
                                            genres.find((g) => g.id === id)
                                                ?.name
                                    )
                                    .join(', ')}
                            </span>
                        )}
                        <span className="text-gray-400 ml-2">
                            ({filteredAndSortedMovies.length} movies)
                        </span>
                    </h2>
                </div>

                {/* Movies Grid/List */}
                {loading && page === 1 ? (
                    <div
                        className={`grid gap-4 ${
                            viewMode === 'grid'
                                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                                : 'grid-cols-1'
                        }`}>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-700 rounded-lg h-64 mb-2"></div>
                                <div className="bg-gray-700 rounded h-4 mb-1"></div>
                                <div className="bg-gray-700 rounded h-3 w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredAndSortedMovies.length > 0 ? (
                    <>
                        <div
                            className={`grid gap-4 ${
                                viewMode === 'grid'
                                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                                    : 'grid-cols-1'
                            }`}>
                            {filteredAndSortedMovies.map((movie) => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    variant={viewMode}
                                />
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                                    {loading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg mb-4">
                            No movies found for the selected criteria.
                        </div>
                        <button
                            onClick={() => {
                                setSelectedGenres([]);
                                setMinRating(0);
                                setYearRange({
                                    min: 1900,
                                    max: new Date().getFullYear(),
                                });
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
