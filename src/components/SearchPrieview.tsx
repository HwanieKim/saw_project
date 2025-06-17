//src/componets/SearchPrieview.tsx

import Image from "next/image";
import Link from "next/link";

interface MoviePriview{
    id: number
    title: string
    posterPath: string|null
    releaseDate: string
}
interface SearchPrieviewProps{
    movie: MoviePriview
}

export default function SearchPrieviewCard({movie}:SearchPrieviewProps){
    const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w200${movie.posterPath}` 
    : '/placeholder-image.png';

    return (
        <Link href={`/movie/${movie.id}`}>
            <div className="flex items-center p-2 hover:bg-gray-700 rounded-md cursor-pointer">
                <div className="flex-shrink-0 w-12 h-18">
                    <Image
                        src={posterUrl}
                        alt={movie.title}
                        width={48}
                        height={72}
                        className="object-cover rounded"
                    />
                </div>
                <div className="ml-4">
                    <p className="font-semibold text-sm text-white">
                        {movie.title}
                    </p>
                    <p className="text-xs text-gray-400">
                        {movie.releaseDate?.substring(0, 4) || 'N/A'}
                    </p>
                </div>
            </div>
        </Link>
    );
}