import { describe, expect, it } from "vitest";
import { formatRating, formatRuntime, formatYear } from "./format";

describe("formatYear", () => {
  it("extrai o ano", () => expect(formatYear("2024-05-10")).toBe("2024"));
  it("vazio sem data", () => expect(formatYear("")).toBe(""));
});

describe("formatRating", () => {
  it("uma casa decimal com vírgula", () => expect(formatRating(7.456)).toBe("7,5"));
  it("inteiro ganha ,0", () => expect(formatRating(8)).toBe("8,0"));
  it("travessão sem nota", () => expect(formatRating(0)).toBe("—"));
});

describe("formatRuntime", () => {
  it("horas e minutos", () => expect(formatRuntime(130)).toBe("2h 10min"));
  it("só minutos", () => expect(formatRuntime(45)).toBe("45min"));
  it("hora cheia", () => expect(formatRuntime(120)).toBe("2h"));
  it("null sem duração", () => {
    expect(formatRuntime(null)).toBeNull();
    expect(formatRuntime(0)).toBeNull();
  });
});
