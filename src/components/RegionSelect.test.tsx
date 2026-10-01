import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegionSelect } from "./RegionSelect";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const regions = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "Estados Unidos" },
];

beforeEach(() => push.mockReset());

describe("RegionSelect", () => {
  it("mostra o país atual selecionado", () => {
    render(<RegionSelect regions={regions} value="BR" />);
    expect(screen.getByLabelText("País")).toHaveValue("BR");
  });

  it("trocar o país zera streaming e página", () => {
    render(<RegionSelect regions={regions} value="BR" />);
    fireEvent.change(screen.getByLabelText("País"), { target: { value: "US" } });
    expect(push).toHaveBeenCalledWith("/?region=US");
  });
});
