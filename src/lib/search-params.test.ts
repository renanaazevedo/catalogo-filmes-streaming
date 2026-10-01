import { describe, expect, it } from "vitest";
import {
  buildHomeHref,
  buildMovieHref,
  lastValidPage,
  parseHomeParams,
  parseMovieId,
  parseRegion,
} from "./search-params";

const REGIONS = ["BR", "US", "PT"];

describe("parseRegion", () => {
  it("aceita região válida", () => {
    expect(parseRegion("US", REGIONS)).toBe("US");
  });
  it("normaliza minúsculas", () => {
    expect(parseRegion("us", REGIONS)).toBe("US");
  });
  it("usa BR para região fora da lista", () => {
    expect(parseRegion("ZZ", REGIONS)).toBe("BR");
  });
  it("usa BR para formato inválido ou ausente", () => {
    expect(parseRegion("brasil")).toBe("BR");
    expect(parseRegion(undefined)).toBe("BR");
  });
  it("sem lista, valida só o formato", () => {
    expect(parseRegion("ZZ")).toBe("ZZ");
  });
  it("usa o primeiro valor quando repetido", () => {
    expect(parseRegion(["US", "PT"], REGIONS)).toBe("US");
  });
});

describe("parseHomeParams", () => {
  it("aplica os padrões quando vazio", () => {
    expect(parseHomeParams({}, REGIONS)).toEqual({ region: "BR", provider: null, page: 1 });
  });
  it("lê valores válidos", () => {
    expect(parseHomeParams({ region: "US", provider: "8", page: "3" }, REGIONS)).toEqual({
      region: "US",
      provider: 8,
      page: 3,
    });
  });
  it.each(["0", "501", "abc", "2.5", "-1", ""])("page inválida %j vira 1", (page) => {
    expect(parseHomeParams({ page }, REGIONS).page).toBe(1);
  });
  it("aceita os limites 1 e 500", () => {
    expect(parseHomeParams({ page: "1" }, REGIONS).page).toBe(1);
    expect(parseHomeParams({ page: "500" }, REGIONS).page).toBe(500);
  });
  it.each(["abc", "0", "-3", "8.1"])("provider inválido %j é ignorado", (provider) => {
    expect(parseHomeParams({ provider }, REGIONS).provider).toBeNull();
  });
  it("usa o primeiro valor de parâmetros repetidos", () => {
    expect(parseHomeParams({ page: ["2", "3"], provider: ["8", "9"] }, REGIONS)).toEqual({
      region: "BR",
      provider: 8,
      page: 2,
    });
  });
});

describe("parseMovieId", () => {
  it("aceita inteiro positivo", () => {
    expect(parseMovieId("550")).toBe(550);
  });
  it.each(["abc", "0", "-1", "5.5", ""])("rejeita %j", (id) => {
    expect(parseMovieId(id)).toBeNull();
  });
});

describe("lastValidPage", () => {
  it("não redireciona dentro do intervalo", () => {
    expect(lastValidPage(2, 3)).toBeNull();
    expect(lastValidPage(3, 3)).toBeNull();
  });
  it("redireciona para a última página", () => {
    expect(lastValidPage(99, 3)).toBe(3);
  });
  it("limita a última página a 500", () => {
    expect(lastValidPage(500, 900)).toBeNull();
  });
  it("não redireciona quando não há resultados", () => {
    expect(lastValidPage(1, 0)).toBeNull();
    expect(lastValidPage(5, 0)).toBeNull();
  });
});

describe("buildHomeHref / buildMovieHref", () => {
  it("omite provider nulo e page 1", () => {
    expect(buildHomeHref({ region: "BR", provider: null, page: 1 })).toBe("/?region=BR");
  });
  it("inclui todos os filtros", () => {
    expect(buildHomeHref({ region: "US", provider: 8, page: 2 })).toBe("/?region=US&provider=8&page=2");
  });
  it("monta o link do filme carregando os filtros", () => {
    expect(buildMovieHref(550, { region: "BR", provider: 8, page: 2 })).toBe(
      "/movie/550?region=BR&provider=8&page=2",
    );
  });
});
