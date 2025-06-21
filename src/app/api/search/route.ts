//src/app/api/search/route
//serverside
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    const TMDB_API_KEY = process.env.TMDB_API_KEY;

    if (!query) {
        return NextResponse.json(
            { message: 'Search query is required' },
            { status: 400 }
        );
    }

    if (!TMDB_API_KEY) {
        console.error('TMDb API key configuration needed');
        return NextResponse.json(
            { message: 'internal server error' },
            { status: 500 }
        );
    }

    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
        query
    )}&api_key=${TMDB_API_KEY}`;

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
    } catch (error) {
        console.error('Error fetching from TMDb', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
