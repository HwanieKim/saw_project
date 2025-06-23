// src/app/api/genres/route.ts
// This file is used to fetch the genres from the TMDb API
import { NextResponse } from 'next/server';

export async function GET() {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
        return NextResponse.json(
            { error: 'TMDb API key required' },
            { status: 500 }
        );
    }

    try {
        const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json({ genres: data.genres });
    } catch (error) {
        console.error('Error fetching genres:', error);
        return NextResponse.json(
            { error: 'Failed to fetch genres' },
            { status: 500 }
        );
    }
}
