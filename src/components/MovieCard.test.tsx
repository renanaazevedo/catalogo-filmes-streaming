import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MovieSummary } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

const params = { region: "BR", provider: 8, page: 2 };
const movie: MovieSummary = {
  id: 550,
  title: "Clube da Luta",
  poster_path: "/poster.jpg",
  release_date: "1999-10-15",
  vote_average: 8.4,
};

describe("MovieCard", () => {
  it("mostra pôster, título, ano e nota, com link que carrega os filtros", () => {
    render(<MovieCard movie={movie} params={params} />);
    expect(screen.getByRole("img", { name: "Pôster de Clube da Luta" })).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w342/poster.jpg",
    );
    expect(screen.getByRole("heading", { name: "Clube da Luta" })).toBeInTheDocument();
    expect(screen.getByText("1999 · ⭐ 8,4")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/movie/550?region=BR&provider=8&page=2");
  });

  it("usa placeholder sem pôster e não mostra 'NaN' sem data", () => {
    render(<MovieCard movie={{ ...movie, poster_path: null, release_date: "", vote_average: 0 }} params={params} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("poster-placeholder")).toHaveTextContent("Clube da Luta");
    expect(screen.getByText("⭐ —")).toBeInTheDocument();
  });
});
