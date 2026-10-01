import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CastList } from "@/components/CastList";
import { Trailer } from "@/components/Trailer";
import { WatchProviders } from "@/components/WatchProviders";
import { formatRating, formatRuntime, formatYear } from "@/lib/format";
import { buildHomeHref, parseHomeParams, parseMovieId, type RawSearchParams } from "@/lib/search-params";
import { TmdbError } from "@/lib/tmdb/client";
import { flatrateProviders, pickTrailer, topCast } from "@/lib/tmdb/details";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { getMovieDetails } from "@/lib/tmdb/movies";
import type { MovieDetails } from "@/lib/tmdb/types";

async function loadMovie(id: number): Promise<MovieDetails> {
  try {
    return await getMovieDetails(id);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) notFound();
    throw error;
  }
}

export default async function MoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const movieId = parseMovieId((await params).id);
  if (movieId === null) notFound();

  const homeParams = parseHomeParams(await searchParams);
  const movie = await loadMovie(movieId);

  const backdrop = backdropUrl(movie.backdrop_path);
  const poster = posterUrl(movie.poster_path);
  const trailer = pickTrailer(movie.videos.results);
  const meta = [formatYear(movie.release_date), formatRuntime(movie.runtime), movie.genres.map((g) => g.name).join(", ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <main>
      {backdrop && (
        <div className="relative h-56 w-full md:h-96">
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
        </div>
      )}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link href={buildHomeHref(homeParams)} className="text-sm text-neutral-400 hover:text-white">
          ← Voltar
        </Link>

        <div className="mt-4 flex flex-col gap-6 md:flex-row">
          <div className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
            {poster ? (
              <Image src={poster} alt={`Pôster de ${movie.title}`} fill sizes="192px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-3 text-center text-sm text-neutral-400">
                {movie.title}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{movie.title}</h1>
            {meta && <p className="mt-1 text-sm text-neutral-400">{meta}</p>}
            <p className="mt-2">⭐ {formatRating(movie.vote_average)}</p>
            <p className="mt-4 leading-relaxed">{movie.overview || "Sinopse indisponível."}</p>
          </div>
        </div>

        <WatchProviders info={flatrateProviders(movie["watch/providers"], homeParams.region)} />
        {trailer && <Trailer video={trailer} />}
        <CastList cast={topCast(movie.credits.cast)} />
      </div>
    </main>
  );
}
