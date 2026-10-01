// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REVALIDATE_SECONDS, TmdbError, tmdbFetch } from "./client";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TMDB_API_TOKEN", "test-token");
  vi.stubEnv("TMDB_BASE_URL", "");
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("tmdbFetch", () => {
  it("chama a URL padrão com os parâmetros, omitindo undefined", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await tmdbFetch("/discover/movie", { page: 2, watch_region: "BR", with_watch_providers: undefined });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://api.themoviedb.org/3/discover/movie");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("watch_region")).toBe("BR");
    expect(url.searchParams.has("with_watch_providers")).toBe(false);
  });

  it("envia o token como Bearer e usa cache de 6h", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await tmdbFetch("/x");
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBe("Bearer test-token");
    expect(init.next).toEqual({ revalidate: REVALIDATE_SECONDS });
    expect(REVALIDATE_SECONDS).toBe(21600);
  });

  it("respeita TMDB_BASE_URL", async () => {
    vi.stubEnv("TMDB_BASE_URL", "http://localhost:4010/3");
    fetchMock.mockResolvedValue(jsonResponse({}));
    await tmdbFetch("/movie/1");
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:4010/3/movie/1");
  });

  it("retorna o JSON da resposta", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 550 }));
    await expect(tmdbFetch<{ id: number }>("/movie/550")).resolves.toEqual({ id: 550 });
  });

  it("falha com mensagem clara sem token", async () => {
    vi.stubEnv("TMDB_API_TOKEN", "");
    await expect(tmdbFetch("/x")).rejects.toThrow("configure TMDB_API_TOKEN no .env.local");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 404, 500])("lança TmdbError com status %i", async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ status_message: "erro do tmdb" }, status));
    const error = await tmdbFetch("/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TmdbError);
    expect((error as TmdbError).status).toBe(status);
    expect((error as TmdbError).message).toBe("erro do tmdb");
  });

  it("lança TmdbError mesmo com corpo que não é JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 502, statusText: "Bad Gateway" }));
    const error = await tmdbFetch("/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TmdbError);
    expect((error as TmdbError).status).toBe(502);
  });
});
