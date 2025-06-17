// src/app/movie/[id]/page.tsx
import * as React from 'react';
import Image from 'next/image';
import { Movie, Genre, Actor, Video } from '@/app/types';
import ActionButtons from '@/components/ActionButtons';
import MovieReviews from '@/components/MovieReviews';

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
    params: { id: string };
}

export default async function MoviePage({ params }: MoviePageProps) {
    const movie = await getMovie(params.id);
    if (!movie) {
        return (
            <div className="text-center mt-10">
                <h2>404 - Movie Not Found</h2>
                <p>We cannot find the movie you were looking for.</p>
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
        <div className="text-white">
            {/* Backdrop Image */}
            <div className="relative w-full h-64 md:h-96">
                {backdropUrl && (
                    <Image
                        src={backdropUrl}
                        alt={movie.title}
                        fill
                        className="object-cover object-top opacity-30"
                        priority
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto p-4 md:p-8 -mt-24 md:-mt-48 relative z-10">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Poster */}
                    <div className="flex-shrink-0 w-48 md:w-72 mx-auto md:mx-0">
                        <Image
                            src={posterUrl}
                            alt={movie.title}
                            width={500}
                            height={750}
                            className="rounded-lg shadow-xl"
                        />
                    </div>

                    {/* Movie Info */}
                    <div className="flex-grow">
                        <h1 className="text-3xl md:text-5xl font-bold">
                            {movie.title}
                        </h1>
                        <p className="text-gray-400 mt-2">
                            {movie.release_date.substring(0, 4)}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {movie.genres.map((genre: Genre) => (
                                <span
                                    key={genre.id}
                                    className="px-3 py-1 bg-gray-700 text-xs rounded-full">
                                    {genre.name}
                                </span>
                            ))}
                        </div>
                        <h2 className="text-2xl font-semibold mt-8 mb-2">
                            Overview
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            {movie.overview}
                        </p>
                        <div className="mt-8">
                            <ActionButtons
                                movieId={movie.id}
                                movieTitle={movie.title}
                            />
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <MovieReviews movieId={movie.id} movieTitle={movie.title} />

                {/* Cast Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-semibold mb-4">
                        Top Billed Cast
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {movie.credits.cast.slice(0, 6).map((actor: Actor) => (
                            <div key={actor.id} className="text-center">
                                <div className="w-full h-40 relative rounded-lg overflow-hidden">
                                    <Image
                                        src={
                                            actor.profile_path
                                                ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                                : '/placeholder-avatar.png'
                                        }
                                        alt={actor.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <p className="font-bold mt-2 text-sm">
                                    {actor.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {actor.character}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trailer Section */}
                {trailer && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-4">Trailer</h2>
                        <div className="aspect-w-16 aspect-h-9">
                            <iframe
                                src={`https://www.youtube.com/embed/${trailer.key}`}
                                title={trailer.name}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full rounded-lg shadow-xl"></iframe>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
