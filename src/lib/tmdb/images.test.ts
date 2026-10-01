import { describe, expect, it } from "vitest";
import { backdropUrl, logoUrl, posterUrl, profileUrl } from "./images";

describe("images", () => {
  it("monta as URLs com o tamanho de cada tipo", () => {
    expect(posterUrl("/a.jpg")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
    expect(backdropUrl("/b.jpg")).toBe("https://image.tmdb.org/t/p/w1280/b.jpg");
    expect(logoUrl("/c.jpg")).toBe("https://image.tmdb.org/t/p/w92/c.jpg");
    expect(profileUrl("/d.jpg")).toBe("https://image.tmdb.org/t/p/w185/d.jpg");
  });
  it("retorna null sem caminho", () => {
    expect(posterUrl(null)).toBeNull();
    expect(profileUrl(null)).toBeNull();
  });
});
