import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { category: string } }
) {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
        return NextResponse.json(
            { error: 'TMDb API key required' },
            { status: 500 }
        );
    }

    const { category } = params;
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const page = searchParams.get('page') || '1';

    // Map category to TMDb endpoint
    const categoryEndpoints: { [key: string]: string } = {
        trending: 'trending/movie/week',
        popular: 'movie/popular',
        'top-rated': 'movie/top_rated',
        upcoming: 'movie/upcoming',
        'now-playing': 'movie/now_playing',
    };

    const endpoint = categoryEndpoints[category];
    if (!endpoint) {
        return NextResponse.json(
            { error: 'Invalid category' },
            { status: 400 }
        );
    }

    try {
        let url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&page=${page}`;

        // Add genre filter if specified
        if (genre) {
            url += `&with_genres=${genre}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching movies:', error);
        return NextResponse.json(
            { error: 'Failed to fetch movies' },
            { status: 500 }
        );
    }
}
