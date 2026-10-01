export const DEFAULT_REGION = "BR";
export const MAX_PAGE = 500;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface HomeParams {
  region: string;
  provider: number | null;
  page: number;
}

type RawValue = string | string[] | undefined;

function first(value: RawValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: RawValue): number | null {
  const text = first(value);
  if (!text || !/^\d+$/.test(text)) return null;
  const n = Number(text);
  return n >= 1 ? n : null;
}

export function parseRegion(value: RawValue, validRegions?: readonly string[]): string {
  const code = first(value)?.toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return DEFAULT_REGION;
  if (validRegions && !validRegions.includes(code)) return DEFAULT_REGION;
  return code;
}

export function parseHomeParams(raw: RawSearchParams, validRegions?: readonly string[]): HomeParams {
  const page = parsePositiveInt(raw.page);
  return {
    region: parseRegion(raw.region, validRegions),
    provider: parsePositiveInt(raw.provider),
    page: page !== null && page <= MAX_PAGE ? page : 1,
  };
}

export function parseMovieId(value: string): number | null {
  return parsePositiveInt(value);
}

export function lastValidPage(page: number, totalPages: number): number | null {
  const last = Math.min(totalPages, MAX_PAGE);
  return last >= 1 && page > last ? last : null;
}

function toQuery({ region, provider, page }: HomeParams): string {
  const query = new URLSearchParams({ region });
  if (provider !== null) query.set("provider", String(provider));
  if (page > 1) query.set("page", String(page));
  return query.toString();
}

export function buildHomeHref(params: HomeParams): string {
  return `/?${toQuery(params)}`;
}

export function buildMovieHref(id: number, params: HomeParams): string {
  return `/movie/${id}?${toQuery(params)}`;
}
