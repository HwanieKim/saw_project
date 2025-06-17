// src/types/index.ts
export interface Genre {
    id: number;
    name: string;
}

export interface Actor {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
}

export interface Movie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    genres?: Genre[];
    credits?: { cast: Actor[] };
    videos?: { results: Video[] };
}

export interface Review {
    id: string;
    userId: string;
    movieId: number;
    movieTitle: string;
    rating: number;
    reviewText: string;
    displayName: string;
    timestamp: Date;
}

export interface ReviewFormData {
    rating: number;
    reviewText: string;
}
