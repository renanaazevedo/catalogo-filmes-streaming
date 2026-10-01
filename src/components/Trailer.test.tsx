import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Trailer } from "./Trailer";

describe("Trailer", () => {
  it("incorpora via youtube-nocookie", () => {
    render(<Trailer video={{ key: "abc123", site: "YouTube", type: "Trailer", iso_639_1: "pt" }} />);
    expect(screen.getByTitle("Trailer")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/abc123");
  });
});
