// src/componenets/MovieCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Movie } from '@/app/types';


interface MovieCardProps {
    movie: Movie;
    variant?: 'grid' | 'preview';
}

export default function MovieCard({ movie, variant = 'grid' }: MovieCardProps) {
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/${variant === 'grid' ? 'w500' : 'w200'}${
              movie.poster_path
          }`
        : '/file.svg';

    if (variant === 'preview') {
        return (
            <Link href={`/movie/${movie.id}`}>
                <div className="flex items-center p-2 hover:bg-gray-700 rounded-md cursor-pointer gap-4">
                    <div className="flex-shrink-0 w-12 h-[72px] relative">
                        {' '}
                        <Image
                            src={posterUrl}
                            alt={movie.title}
                            fill 
                            className="object-cover rounded"
                        />
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-semibold text-sm text-white truncate">
                            {movie.title}
                        </p>
                        <p className="text-xs text-gray-400">
                            {movie.release_date?.substring(0, 4) || 'N/A'}
                        </p>
                    </div>
                </div>
            </Link>
        );
    }
    return (
        <Link
            href={`/movie/${movie.id}`}
            className="group block bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-indigo-500/30">
            <div className="relative w-full h-[375px]">
                {' '}
                <Image
                    src={posterUrl}
                    alt={`${movie.title} poster`}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="p-3">
                <h3 className="text-base font-semibold text-white truncate group-hover:text-indigo-400">
                    {movie.title}
                </h3>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                    <span>{movie.release_date?.substring(0, 4) || 'N/A'}</span>
                    {movie.vote_average&& movie.vote_average > 0 && (
                        <div className="flex items-center gap-1">
                            <svg
                                className="w-4 h-4 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span>{movie.vote_average.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
