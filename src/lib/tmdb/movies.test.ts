// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tmdbFetch } from "./client";
import { discoverMovies, getMovieDetails } from "./movies";

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  tmdbFetch: vi.fn(),
}));

const fetchMock = vi.mocked(tmdbFetch);

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({});
});

describe("discoverMovies", () => {
  it("pede só filmes de assinatura no país, com o streaming escolhido", async () => {
    await discoverMovies({ region: "US", provider: 8, page: 3 });
    expect(fetchMock).toHaveBeenCalledWith("/discover/movie", {
      watch_region: "US",
      with_watch_monetization_types: "flatrate",
      with_watch_providers: 8,
      language: "pt-BR",
      sort_by: "popularity.desc",
      page: 3,
    });
  });

  it("não envia with_watch_providers sem streaming selecionado", async () => {
    await discoverMovies({ region: "BR", provider: null, page: 1 });
    const params = fetchMock.mock.calls[0][1]!;
    expect(params.with_watch_providers).toBeUndefined();
    expect(params.with_watch_monetization_types).toBe("flatrate");
  });
});

describe("getMovieDetails", () => {
  it("pede detalhes com elenco, vídeos e streamings", async () => {
    await getMovieDetails(550);
    expect(fetchMock).toHaveBeenCalledWith("/movie/550", {
      language: "pt-BR",
      append_to_response: "credits,videos,watch/providers",
      include_video_language: "pt,en",
    });
  });
});
