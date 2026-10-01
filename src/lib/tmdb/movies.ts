import type { HomeParams } from "@/lib/search-params";
import { LANGUAGE, tmdbFetch } from "./client";
import type { DiscoverResponse, MovieDetails } from "./types";

export function discoverMovies({ region, provider, page }: HomeParams): Promise<DiscoverResponse> {
  return tmdbFetch<DiscoverResponse>("/discover/movie", {
    watch_region: region,
    with_watch_monetization_types: "flatrate",
    with_watch_providers: provider ?? undefined,
    language: LANGUAGE,
    sort_by: "popularity.desc",
    page,
  });
}

export function getMovieDetails(id: number): Promise<MovieDetails> {
  return tmdbFetch<MovieDetails>(`/movie/${id}`, {
    language: LANGUAGE,
    append_to_response: "credits,videos,watch/providers",
    include_video_language: "pt,en",
  });
}
