const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

const headers = {
  Authorization: `Bearer ${TMDB_TOKEN}`,
  accept: 'application/json',
};

export async function getMovies(type: "movie" | "tv" | "trending") {
  if (!TMDB_TOKEN) {
    console.warn("VITE_TMDB_TOKEN não configurado.");
    return [];
  }

  const url = type === "trending" 
    ? `${BASE_URL}/trending/all/week?language=pt-BR`
    : `${BASE_URL}/${type}/popular?language=pt-BR`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error("Failed to fetch movies");
  }
  const data = await res.json();
  return data.results;
}

export async function searchMovies(query: string) {
  if (!TMDB_TOKEN || !query) return [];

  const url = `${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=pt-BR`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error("Search failed");
  }
  const data = await res.json();
  return data.results;
}

export async function getMovieDetails(id: number, type: "movie" | "tv" = "movie") {
  if (!TMDB_TOKEN) return null;

  const url = `${BASE_URL}/${type}/${id}?language=pt-BR&append_to_response=credits,videos,release_dates,content_ratings`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error("Failed to fetch movie details");
  }
  const data = await res.json();
  return data;
}

export async function getVideos(id: number, type: "movie" | "tv" = "movie") {
  if (!TMDB_TOKEN) return [];

  const url = `${BASE_URL}/${type}/${id}/videos?language=pt-BR`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error("Failed to fetch videos");
  }
  const data = await res.json();
  return data.results;
}

export async function getSeasonDetails(id: number, seasonNumber: number) {
  if (!TMDB_TOKEN) return null;

  const url = `${BASE_URL}/tv/${id}/season/${seasonNumber}?language=pt-BR`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error("Failed to fetch season details");
  }
  const data = await res.json();
  return data;
}
