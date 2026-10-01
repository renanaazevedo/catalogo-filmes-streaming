import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("na primeira página só há 'Próxima'", () => {
    render(<Pagination params={{ region: "BR", provider: null, page: 1 }} totalPages={3} />);
    expect(screen.queryByRole("link", { name: "Anterior" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute("href", "/?region=BR&page=2");
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("na última página só há 'Anterior', preservando os filtros", () => {
    render(<Pagination params={{ region: "US", provider: 8, page: 3 }} totalPages={3} />);
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("href", "/?region=US&provider=8&page=2");
    expect(screen.queryByRole("link", { name: "Próxima" })).not.toBeInTheDocument();
  });

  it("limita o total a 500 páginas", () => {
    render(<Pagination params={{ region: "BR", provider: null, page: 500 }} totalPages={900} />);
    expect(screen.getByText("Página 500 de 500")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Próxima" })).not.toBeInTheDocument();
  });
});
