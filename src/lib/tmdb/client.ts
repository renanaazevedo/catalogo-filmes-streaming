const DEFAULT_BASE_URL = "https://api.themoviedb.org/3";

export const LANGUAGE = "pt-BR";
export const REVALIDATE_SECONDS = 21600; // 6h

export class TmdbError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

export type QueryParams = Record<string, string | number | undefined>;

export async function tmdbFetch<T>(path: string, params: QueryParams = {}): Promise<T> {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) throw new Error("configure TMDB_API_TOKEN no .env.local");

  const baseUrl = process.env.TMDB_BASE_URL || DEFAULT_BASE_URL;
  const url = new URL(baseUrl + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { status_message?: string };
      message = body.status_message ?? message;
    } catch {
      // corpo não é JSON: mantém o statusText
    }
    throw new TmdbError(response.status, message);
  }

  return (await response.json()) as T;
}
