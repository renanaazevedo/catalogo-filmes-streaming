import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Provider } from "@/lib/tmdb/types";
import { ProviderFilter } from "./ProviderFilter";

const providers: Provider[] = [
  { id: 8, name: "Netflix", logoPath: "/n.png", priority: 1 },
  { id: 119, name: "Amazon Prime Video", logoPath: null, priority: 2 },
];

describe("ProviderFilter", () => {
  it("cada streaming leva à página 1 filtrada, mantendo o país", () => {
    render(<ProviderFilter providers={providers} params={{ region: "BR", provider: null, page: 4 }} />);
    expect(screen.getByRole("link", { name: "Netflix" })).toHaveAttribute("href", "/?region=BR&provider=8");
    expect(screen.getByRole("link", { name: "Amazon Prime Video" })).toHaveAttribute(
      "href",
      "/?region=BR&provider=119",
    );
  });

  it("marca o selecionado, e clicar nele limpa o filtro", () => {
    render(<ProviderFilter providers={providers} params={{ region: "BR", provider: 8, page: 2 }} />);
    const netflix = screen.getByRole("link", { name: "Netflix" });
    expect(netflix).toHaveAttribute("aria-current", "true");
    expect(netflix).toHaveAttribute("href", "/?region=BR");
    expect(screen.getByRole("link", { name: "Amazon Prime Video" })).not.toHaveAttribute("aria-current");
  });

  it("sem logo, mostra o nome", () => {
    render(<ProviderFilter providers={providers} params={{ region: "BR", provider: null, page: 1 }} />);
    expect(screen.getByText("Amazon Prime Video")).toBeInTheDocument();
  });
});
