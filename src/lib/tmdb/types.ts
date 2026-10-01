export interface MovieSummary {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string; // "YYYY-MM-DD" ou ""
  vote_average: number;
}

export interface DiscoverResponse {
  page: number;
  results: MovieSummary[];
  total_pages: number;
  total_results: number;
}

export interface ProviderApi {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
  display_priorities?: Record<string, number>;
}

export interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
  priority: number;
}

export interface RegionApi {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export interface Region {
  code: string;
  name: string;
}

export interface ProviderLogo {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface RegionWatchProviders {
  link?: string;
  flatrate?: ProviderLogo[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface Video {
  key: string;
  site: string;
  type: string;
  iso_639_1: string;
}

export interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
  credits: { cast: CastMember[] };
  videos: { results: Video[] };
  "watch/providers": { results: Record<string, RegionWatchProviders> };
}
