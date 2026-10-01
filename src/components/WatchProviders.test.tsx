import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WatchProviders } from "./WatchProviders";

describe("WatchProviders", () => {
  it("lista os streamings com link e crédito da JustWatch", () => {
    render(
      <WatchProviders
        info={{
          link: "https://www.themoviedb.org/movie/550/watch?locale=BR",
          providers: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" }],
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Onde assistir" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Netflix" })).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/movie/550/watch?locale=BR",
    );
    expect(screen.getByText("Dados de JustWatch")).toBeInTheDocument();
  });

  it("avisa quando não há streaming no país", () => {
    render(<WatchProviders info={{ link: null, providers: [] }} />);
    expect(screen.getByText("Indisponível em streaming por assinatura neste país.")).toBeInTheDocument();
    expect(screen.queryByText("Dados de JustWatch")).not.toBeInTheDocument();
  });
});
