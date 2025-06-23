//src/app/movie/[id]/route.ts
// This file is used to fetch the movie details from the TMDb API
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { id: movieId } = await context.params;
    const TMDB_API_KEY = process.env.TMDB_API_KEY;

    if (!movieId) {
        return NextResponse.json(
            { message: 'movie ID requierd' },
            { status: 400 }
        );
    }

    if (!TMDB_API_KEY) {
        console.error('TMDb api key not configured');
        return NextResponse.json(
            { message: 'internal server errror: API KEY MISSING' },
            { status: 500 }
        );
    }

    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            //tmdb error, forward it to client
            const errorData = await res.json();
            return NextResponse.json(
                {
                    message:
                        errorData.status_message ||
                        'Failed to fetch data from TMDb',
                },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error(
            `Unexpected error in /api/movie/[id] for ${movieId}:`,
            error
        );
        let errorMessage = 'Internal Server Error during movie detail fetch';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
