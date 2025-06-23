// src/app/movie/[id]/page.tsx
import * as React from 'react';
import Image from 'next/image';
import { Movie, Genre, Actor, Video } from '@/app/types';
import ActionButtons from '@/components/ActionButtons';
import MovieReviews from '@/components/MovieReviews';
import StarRating from '@/components/StarRating';

interface MovieDetails extends Movie {
    genres: Genre[];
    credits: {
        cast: Actor[];
    };
    videos: {
        results: Video[];
    };
}

async function getMovie(movieId: string): Promise<MovieDetails | null> {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
        console.error('TMDb api key required');
        return null;
    }

    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) {
            console.error(
                `failed to fetch the movie ${movieId}, Status: ${res.status}`
            );
            return null;
        }
        return res.json();
    } catch (error) {
        console.error('failed to fetch movie:', error);
        return null;
    }
}

interface MoviePageProps {
    params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: MoviePageProps) {
    const { id } = await params;
    const movie = await getMovie(id);

    if (!movie) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        404 - Movie Not Found
                    </h2>
                    <p className="text-gray-400 mb-6">
                        We cannot find the movie you were looking for.
                    </p>
                    <a
                        href="/discover"
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Browse Movies
                    </a>
                </div>
            </div>
        );
    }

    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : '/placeholder-image.png';
    const backdropUrl = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
        : '';
    const trailer = movie.videos.results.find(
        (v: Video) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Backdrop Image */}
            <div className="relative w-full h-64 md:h-96 lg:h-[500px]">
                {backdropUrl && (
                    <Image
                        src={backdropUrl}
                        alt={movie.title}
                        fill
                        className="object-cover object-top opacity-30"
                        priority
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto p-4 md:p-8 -mt-24 md:-mt-48 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Poster */}
                    <div className="flex-shrink-0 w-48 md:w-72 mx-auto lg:mx-0">
                        <div className="relative">
                            <Image
                                src={posterUrl}
                                alt={movie.title}
                                width={500}
                                height={750}
                                className="rounded-lg shadow-2xl"
                            />
                        </div>
                    </div>

                    {/* Movie Info */}
                    <div className="flex-grow">
                        <div className="mb-4">
                            <h1 className="text-3xl md:text-5xl font-bold mb-2">
                                {movie.title}
                            </h1>
                            <div className="flex items-center gap-4 text-gray-400 mb-4">
                                <span>
                                    {movie.release_date.substring(0, 4)}
                                </span>
                                {movie.vote_average &&
                                    movie.vote_average > 0 && (
                                        <div className="flex items-center gap-2">
                                            <StarRating
                                                value={movie.vote_average}
                                                interactive={false}
                                                showValue={true}
                                                size="md"
                                            />
                                            <span className="text-sm">
                                                ({movie.vote_average.toFixed(1)}
                                                /10)
                                            </span>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {movie.genres.map((genre: Genre) => (
                                <span
                                    key={genre.id}
                                    className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-full hover:bg-indigo-600/30 transition-colors">
                                    {genre.name}
                                </span>
                            ))}
                        </div>

                        {/* Overview */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold mb-3 text-white">
                                Overview
                            </h2>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                {movie.overview ||
                                    'No overview available for this movie.'}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <ActionButtons
                            movieId={movie.id}
                            movieTitle={movie.title}
                            posterPath={movie.poster_path || null}
                            releaseDate={movie.release_date || null}
                            voteAverage={
                                typeof movie.vote_average === 'number'
                                    ? movie.vote_average
                                    : null
                            }
                        />
                    </div>
                </div>

                {/* Reviews Section */}
                <MovieReviews
                    movieId={movie.id}
                    moviePoster={movie.poster_path || null}
                    movieTitle={movie.title}
                />

                {/* Cast Section */}
                {movie.credits.cast.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-6">
                            Top Billed Cast
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {movie.credits.cast
                                .slice(0, 6)
                                .map((actor: Actor) => (
                                    <div key={actor.id} className="group">
                                        <div className="relative w-full h-84 rounded-lg overflow-hidden bg-gray-800 shadow-lg">
                                            <Image
                                                src={
                                                    actor.profile_path
                                                        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                                        : '/placeholder-avatar.png'
                                                }
                                                alt={actor.name}
                                                width={185}
                                                height={278}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <div className="mt-2 text-center">
                                            <div className="font-semibold text-white truncate">
                                                {actor.name}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {actor.character}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Trailer Section */}
                {trailer && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-6">Trailer</h2>
                        <div className="aspect-w-16 aspect-h-9">
                            <iframe
                                src={`https://www.youtube.com/embed/${trailer.key}`}
                                title="YouTube trailer"
                                allowFullScreen
                                className="w-full h-190 rounded-lg border-0"></iframe>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
