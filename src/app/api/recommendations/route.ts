import { NextRequest, NextResponse } from 'next/server';

type TMDBMovie = {
    id: number;
    title: string;
    poster_path: string | null;
};

export async function POST(req: NextRequest) {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
        return NextResponse.json(
            { message: 'TMDb API key missing' },
            { status: 500 }
        );
    }

    let movieIds: string[] = [];
    try {
        const body = await req.json();
        movieIds = body.movieIds;
        if (!Array.isArray(movieIds) || movieIds.length === 0) {
            return NextResponse.json(
                { message: 'movieIds array required' },
                { status: 400 }
            );
        }
    } catch {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    // Limit to first 5 movies in watchlist for performance
    const limitedIds = movieIds.slice(0, 5);
    const allRecs: TMDBMovie[] = [];
    for (const id of limitedIds) {
        const url = `https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${TMDB_API_KEY}`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.results)) {
                    allRecs.push(...data.results.slice(0, 5)); // top 5 per movie
                }
            }
        } catch {
            // Ignore errors for individual movies
        }
    }
    // Deduplicate by movie id
    const seen = new Set();
    const deduped = allRecs.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
    });
    // Limit to 20 total
    return NextResponse.json({ results: deduped.slice(0, 20) });
}
