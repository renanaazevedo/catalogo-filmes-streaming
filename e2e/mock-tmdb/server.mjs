import http from "node:http";
import { readFileSync } from "node:fs";

const PORT = 4010;
const TOKEN = "e2e-token";
const TOTAL_PAGES = 3;
const PAGE_SIZE = 20;

function fixture(name) {
  try {
    return JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
  } catch {
    return null;
  }
}

function discover(query) {
  const region = query.get("watch_region") ?? "BR";
  const provider = query.get("with_watch_providers") ?? "todos";
  const page = Number(query.get("page") ?? 1);
  const total = { total_pages: TOTAL_PAGES, total_results: TOTAL_PAGES * PAGE_SIZE };
  if (page > TOTAL_PAGES) return { page, results: [], ...total };
  const results = Array.from({ length: PAGE_SIZE }, (_, i) => ({
    id: page * 100 + i + 1,
    title: `Filme ${region} ${provider} p${page} #${i + 1}`,
    poster_path: null,
    release_date: "2024-05-10",
    vote_average: 7.5,
  }));
  return { page, results, ...total };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const send = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === "/health") return send(200, { ok: true });
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(401, { status_message: "Invalid API key" });

  if (url.pathname === "/3/watch/providers/regions") return send(200, fixture("regions.json"));
  if (url.pathname === "/3/watch/providers/movie") {
    return send(200, fixture(`providers-${url.searchParams.get("watch_region")}.json`) ?? { results: [] });
  }
  if (url.pathname === "/3/discover/movie") return send(200, discover(url.searchParams));

  const movie = url.pathname.match(/^\/3\/movie\/(\d+)$/);
  if (movie) {
    if (movie[1] === "999") return send(404, { status_message: "The resource you requested could not be found." });
    return send(200, { ...fixture("movie-detail.json"), id: Number(movie[1]) });
  }

  send(404, { status_message: "not found" });
});

server.listen(PORT, () => console.log(`mock TMDB em http://localhost:${PORT}`));
