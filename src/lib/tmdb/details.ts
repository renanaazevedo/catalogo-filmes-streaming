import type { CastMember, MovieDetails, ProviderLogo, Video } from "./types";

export const TOP_CAST = 10;

export function pickTrailer(videos: Video[]): Video | null {
  const trailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  return (
    trailers.find((v) => v.iso_639_1 === "pt") ??
    trailers.find((v) => v.iso_639_1 === "en") ??
    trailers[0] ??
    null
  );
}

export function topCast(cast: CastMember[]): CastMember[] {
  return [...cast].sort((a, b) => a.order - b.order).slice(0, TOP_CAST);
}

export interface RegionWatchInfo {
  link: string | null;
  providers: ProviderLogo[];
}

export function flatrateProviders(
  watch: MovieDetails["watch/providers"] | undefined,
  region: string,
): RegionWatchInfo {
  const entry = watch?.results?.[region];
  return { link: entry?.link ?? null, providers: entry?.flatrate ?? [] };
}
