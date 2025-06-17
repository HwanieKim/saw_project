'use client';

import { useState, useEffect } from 'react';
import { Movie, Genre } from '@/app/types';
import MovieCard from '@/components/MovieCard';

interface DiscoverPageProps {}

export default function DiscoverPage({}: DiscoverPageProps) {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('trending');
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [genres, setGenres] = useState<Genre[]>([]);

    const categories = [
        { id: 'trending', name: 'Trending Now' },
        { id: 'popular', name: 'Popular' },
        { id: 'top-rated', name: 'Top Rated' },
        { id: 'upcoming', name: 'Upcoming' },
        { id: 'now-playing', name: 'Now Playing' },
    ];

    useEffect(() => {
        fetchGenres();
    }, []);

    useEffect(() => {
        fetchMovies();
    }, [activeCategory, selectedGenre]);

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

    const fetchMovies = async () => {
        setLoading(true);
        try {
            let endpoint = `/api/movies/${activeCategory}`;
            if (selectedGenre) {
                endpoint += `?genre=${selectedGenre}`;
            }

            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                setMovies(data.results || []);
            }
        } catch (error) {
            console.error('Error fetching movies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
        setSelectedGenre(null);
    };

    const handleGenreChange = (genreId: number | null) => {
        setSelectedGenre(genreId);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-8">Discover Movies</h1>

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
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    activeCategory === category.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}>
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Genres Filter */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Filter by Genre
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleGenreChange(null)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                selectedGenre === null
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}>
                            All Genres
                        </button>
                        {genres.map((genre) => (
                            <button
                                key={genre.id}
                                onClick={() => handleGenreChange(genre.id)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    selectedGenre === genre.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}>
                                {genre.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Movies Grid */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        {categories.find((c) => c.id === activeCategory)?.name}
                        {selectedGenre &&
                            ` - ${
                                genres.find((g) => g.id === selectedGenre)?.name
                            }`}
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="bg-gray-700 rounded-lg h-64 mb-2"></div>
                                    <div className="bg-gray-700 rounded h-4 mb-1"></div>
                                    <div className="bg-gray-700 rounded h-3 w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : movies.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {movies.map((movie) => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    variant="grid"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-lg">
                                No movies found for the selected criteria.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
