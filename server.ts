import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // TMDB API Proxy
  app.get("/api/movies", async (req, res) => {
    const { type = "trending" } = req.query;
    const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!TMDB_TOKEN || TMDB_TOKEN.includes("MY_TMDB_TOKEN") || TMDB_TOKEN.length < 50) {
      console.warn("TMDB_READ_ACCESS_TOKEN not configured or invalid. Returning empty results.");
      return res.json([]);
    }

    const url = type === "trending" 
      ? `https://api.themoviedb.org/3/trending/all/week?language=pt-BR`
      : `https://api.themoviedb.org/3/${type}/popular?language=pt-BR`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          accept: 'application/json',
        },
      });
      const data = await response.json();
      res.json(data.results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from TMDB" });
    }
  });

  app.get("/api/search", async (req, res) => {
    const { q } = req.query;
    const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!TMDB_TOKEN || TMDB_TOKEN.includes("MY_TMDB_TOKEN") || TMDB_TOKEN.length < 50) {
      return res.json([]);
    }

    if (!q) return res.json([]);

    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q as string)}&language=pt-BR`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          accept: 'application/json',
        },
      });
      const data = await response.json();
      res.json(data.results);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    const { id } = req.params;
    const { type = "movie" } = req.query;
    const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!TMDB_TOKEN || TMDB_TOKEN.includes("MY_TMDB_TOKEN") || TMDB_TOKEN.length < 50) {
      return res.json([]);
    }

    const url = `https://api.themoviedb.org/3/${type}/${id}/videos?language=pt-BR`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          accept: 'application/json',
        },
      });
      const data = await response.json();
      res.json(data.results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
