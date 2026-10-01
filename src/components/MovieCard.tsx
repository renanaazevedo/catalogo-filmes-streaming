import Image from "next/image";
import Link from "next/link";
import { formatRating, formatYear } from "@/lib/format";
import { buildMovieHref, type HomeParams } from "@/lib/search-params";
import { posterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";

export function MovieCard({ movie, params }: { movie: MovieSummary; params: HomeParams }) {
  const poster = posterUrl(movie.poster_path);
  const year = formatYear(movie.release_date);

  return (
    <Link href={buildMovieHref(movie.id, params)} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
        {poster ? (
          <Image
            src={poster}
            alt={`Pôster de ${movie.title}`}
            fill
            sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div
            data-testid="poster-placeholder"
            className="flex h-full items-center justify-center p-3 text-center text-sm text-neutral-400"
          >
            {movie.title}
          </div>
        )}
      </div>
      <h2 className="mt-2 line-clamp-2 text-sm font-medium">{movie.title}</h2>
      <p className="text-xs text-neutral-400">
        {year ? `${year} · ` : ""}⭐ {formatRating(movie.vote_average)}
      </p>
    </Link>
  );
}
