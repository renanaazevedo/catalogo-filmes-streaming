// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tmdbFetch } from "./client";
import { getProviders, getRegions, MAX_PROVIDERS } from "./providers";

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  tmdbFetch: vi.fn(),
}));

const fetchMock = vi.mocked(tmdbFetch);

beforeEach(() => fetchMock.mockReset());

describe("getProviders", () => {
  it("pede os streamings do país e ordena pela prioridade regional", async () => {
    fetchMock.mockResolvedValue({
      results: [
        { provider_id: 1, provider_name: "A", logo_path: "/a.png", display_priority: 1, display_priorities: { BR: 30 } },
        { provider_id: 8, provider_name: "Netflix", logo_path: "/n.png", display_priority: 50, display_priorities: { BR: 2 } },
        { provider_id: 9, provider_name: "Sem regional", logo_path: null, display_priority: 10 },
      ],
    });
    const providers = await getProviders("BR");
    expect(fetchMock).toHaveBeenCalledWith("/watch/providers/movie", { watch_region: "BR", language: "pt-BR" });
    expect(providers.map((p) => p.id)).toEqual([8, 9, 1]);
    expect(providers[0]).toEqual({ id: 8, name: "Netflix", logoPath: "/n.png", priority: 2 });
  });

  it("limita a 20 streamings", async () => {
    fetchMock.mockResolvedValue({
      results: Array.from({ length: 30 }, (_, i) => ({
        provider_id: i + 1,
        provider_name: `P${i}`,
        logo_path: null,
        display_priority: i,
      })),
    });
    expect(MAX_PROVIDERS).toBe(20);
    expect(await getProviders("BR")).toHaveLength(20);
  });
});

describe("getRegions", () => {
  it("mapeia e ordena os países por nome em pt-BR", async () => {
    fetchMock.mockResolvedValue({
      results: [
        { iso_3166_1: "US", english_name: "United States of America", native_name: "Estados Unidos" },
        { iso_3166_1: "AT", english_name: "Austria", native_name: "Áustria" },
        { iso_3166_1: "BR", english_name: "Brazil", native_name: "Brasil" },
        { iso_3166_1: "XK", english_name: "Kosovo", native_name: "" },
      ],
    });
    const regions = await getRegions();
    expect(fetchMock).toHaveBeenCalledWith("/watch/providers/regions", { language: "pt-BR" });
    expect(regions).toEqual([
      { code: "AT", name: "Áustria" },
      { code: "BR", name: "Brasil" },
      { code: "US", name: "Estados Unidos" },
      { code: "XK", name: "Kosovo" },
    ]);
  });
});
