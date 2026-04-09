// Usando o padrão de segurança do Vite para Cloudflare
const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function getMovies(type: "movie" | "tv" | "trending") {
  const endpoint = type === 'trending' ? '/trending/all/week' : `/${type}/popular`;
  const res = await fetch(`${BASE_URL}${endpoint}?language=pt-BR`, {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      accept: 'application/json',
    }
  });
  if (!res.ok) throw new Error("Failed to fetch movies");
  const data = await res.json();
  return data.results || [];
}

export async function searchMovies(query: string) {
  const res = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=pt-BR`, {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      accept: 'application/json',
    }
  });
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.results || [];
}

export async function getVideos(id: number, type: "movie" | "tv" = "movie") {
  const res = await fetch(`${BASE_URL}/${type}/${id}/videos?language=pt-BR`, {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      accept: 'application/json',
    }
  });
  if (!res.ok) throw new Error("Failed to fetch videos");
  const data = await res.json();
  return data.results || [];
}
