import { LANGUAGE, tmdbFetch } from "./client";
import type { Provider, ProviderApi, Region, RegionApi } from "./types";

export const MAX_PROVIDERS = 20;

export async function getProviders(region: string): Promise<Provider[]> {
  const data = await tmdbFetch<{ results: ProviderApi[] }>("/watch/providers/movie", {
    watch_region: region,
    language: LANGUAGE,
  });
  return data.results
    .map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path,
      priority: p.display_priorities?.[region] ?? p.display_priority,
    }))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_PROVIDERS);
}

export async function getRegions(): Promise<Region[]> {
  const data = await tmdbFetch<{ results: RegionApi[] }>("/watch/providers/regions", { language: LANGUAGE });
  return data.results
    .map((r) => ({ code: r.iso_3166_1, name: r.native_name || r.english_name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
