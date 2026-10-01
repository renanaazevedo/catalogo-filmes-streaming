import { describe, expect, it } from "vitest";
import { flatrateProviders, pickTrailer, topCast } from "./details";
import type { CastMember, Video } from "./types";

const video = (over: Partial<Video>): Video => ({ key: "k", site: "YouTube", type: "Trailer", iso_639_1: "en", ...over });

describe("pickTrailer", () => {
  it("prefere trailer em português", () => {
    const videos = [video({ key: "en1" }), video({ key: "pt1", iso_639_1: "pt" })];
    expect(pickTrailer(videos)?.key).toBe("pt1");
  });
  it("cai para inglês", () => {
    expect(pickTrailer([video({ key: "es1", iso_639_1: "es" }), video({ key: "en1" })])?.key).toBe("en1");
  });
  it("ignora o que não é trailer do YouTube", () => {
    const videos = [video({ key: "t", type: "Teaser" }), video({ key: "v", site: "Vimeo" })];
    expect(pickTrailer(videos)).toBeNull();
  });
  it("aceita trailer de outro idioma se for o único", () => {
    expect(pickTrailer([video({ key: "es1", iso_639_1: "es" })])?.key).toBe("es1");
  });
});

describe("topCast", () => {
  it("ordena por order e limita a 10", () => {
    const cast: CastMember[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      name: `Ator ${i}`,
      character: "X",
      profile_path: null,
      order: 14 - i,
    }));
    const result = topCast(cast);
    expect(result).toHaveLength(10);
    expect(result[0].order).toBe(0);
    expect(result[9].order).toBe(9);
  });
});

describe("flatrateProviders", () => {
  const netflix = { provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" };
  const watch = { results: { BR: { link: "https://tmdb/watch", flatrate: [netflix] }, US: { link: "https://tmdb/us" } } };

  it("retorna link e streamings de assinatura do país", () => {
    expect(flatrateProviders(watch, "BR")).toEqual({ link: "https://tmdb/watch", providers: [netflix] });
  });
  it("país sem flatrate retorna lista vazia", () => {
    expect(flatrateProviders(watch, "US")).toEqual({ link: "https://tmdb/us", providers: [] });
  });
  it("país ausente ou dados ausentes", () => {
    expect(flatrateProviders(watch, "PT")).toEqual({ link: null, providers: [] });
    expect(flatrateProviders(undefined, "BR")).toEqual({ link: null, providers: [] });
  });
});
