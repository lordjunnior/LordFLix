export async function getMovies(type: "movie" | "tv" | "trending") {
  const res = await fetch(`/api/movies?type=${type}`);
  if (!res.ok) {
    throw new Error("Failed to fetch movies");
  }
  return res.json();
}

export async function searchMovies(query: string) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error("Search failed");
  }
  return res.json();
}

export async function getVideos(id: number, type: "movie" | "tv" = "movie") {
  const res = await fetch(`/api/videos/${id}?type=${type}`);
  if (!res.ok) {
    throw new Error("Failed to fetch videos");
  }
  return res.json();
}
