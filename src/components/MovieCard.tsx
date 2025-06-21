// src/componenets/MovieCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Movie } from '@/app/types';
import StarRating from './StarRating';

interface MovieCardProps {
    movie: Movie;
    variant?: 'grid' | 'preview' | 'list';
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

    if (variant === 'list') {
        return (
            <Link href={`/movie/${movie.id}`}>
                <div className="flex items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer gap-4">
                    <div className="flex-shrink-0 w-16 h-24 relative">
                        <Image
                            src={posterUrl}
                            alt={movie.title}
                            fill
                            className="object-cover rounded"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                            {movie.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            {movie.release_date?.substring(0, 4) || 'N/A'}
                        </p>
                        {movie.overview && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {movie.overview}
                            </p>
                        )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                        {movie.vote_average && movie.vote_average > 0 && (
                            <div className="flex items-center gap-1 justify-end">
                                <StarRating
                                    value={movie.vote_average}
                                    interactive={false}
                                    showValue={false}
                                    size="sm"
                                />
                                <span className="text-sm font-medium">
                                    {movie.vote_average.toFixed(1)}
                                </span>
                            </div>
                        )}
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
                    {movie.vote_average && movie.vote_average > 0 && (
                        <div className="flex items-center gap-1">
                            <StarRating
                                value={movie.vote_average}
                                interactive={false}
                                showValue={false}
                                size="sm"
                            />
                            <span className="text-sm font-medium">
                                {movie.vote_average.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
