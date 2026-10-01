import Link from "next/link";
import { redirect } from "next/navigation";
import { MovieGrid } from "@/components/MovieGrid";
import { Pagination } from "@/components/Pagination";
import { ProviderFilter } from "@/components/ProviderFilter";
import { RegionSelect } from "@/components/RegionSelect";
import { buildHomeHref, lastValidPage, parseHomeParams, type RawSearchParams } from "@/lib/search-params";
import { discoverMovies } from "@/lib/tmdb/movies";
import { getProviders, getRegions } from "@/lib/tmdb/providers";

export default async function Home({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  // Ler searchParams primeiro torna a rota dinâmica: o build não chama o TMDB.
  const raw = await searchParams;
  const regions = await getRegions();
  const params = parseHomeParams(
    raw,
    regions.map((r) => r.code),
  );
  const [movies, providers] = await Promise.all([discoverMovies(params), getProviders(params.region)]);

  const redirectPage = lastValidPage(params.page, movies.total_pages);
  if (redirectPage !== null) redirect(buildHomeHref({ ...params, page: redirectPage }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Em cartaz no streaming</h1>
        <RegionSelect regions={regions} value={params.region} />
      </header>

      <ProviderFilter providers={providers} params={params} />

      {movies.results.length === 0 ? (
        <div className="py-16 text-center text-neutral-400">
          <p>Nenhum filme encontrado para este streaming neste país.</p>
          {params.provider !== null && (
            <Link
              href={buildHomeHref({ ...params, provider: null, page: 1 })}
              className="mt-4 inline-block underline hover:text-white"
            >
              Limpar filtro
            </Link>
          )}
        </div>
      ) : (
        <>
          <MovieGrid movies={movies.results} params={params} />
          <Pagination params={params} totalPages={movies.total_pages} />
        </>
      )}
    </main>
  );
}
