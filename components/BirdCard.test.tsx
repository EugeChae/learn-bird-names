import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BirdCard from "@/components/BirdCard";
import type { Species } from "@/types";

function species(overrides: Partial<Species> = {}): Species {
  return {
    id: "pica-serica",
    name_korean: "까치",
    name_latin: "Pica serica",
    name_english: "Oriental Magpie",
    order: "Passeriformes",
    family: "Corvidae",
    habitat: ["도시·마을"],
    difficulty_tier: 1,
    abundance: "c",
    status: ["Res"],
    media: [
      {
        url: "https://example.com/magpie.jpg",
        sex: "unknown",
        age: "adult",
        plumage: "unknown",
        angle: "unknown",
        license: "CC-BY-NC",
        attribution: "(c) Tester",
        quality_score: 2,
      },
    ],
    trivia: [],
    ...overrides,
  };
}

describe("BirdCard", () => {
  it("한국 공식명과 사진을 보여 준다", () => {
    render(<BirdCard species={species()} />);
    expect(screen.getByRole("heading", { name: "까치" })).toBeInTheDocument();
    const img = screen.getByRole("img", { name: "까치" });
    expect(img).toHaveAttribute("src", "https://example.com/magpie.jpg");
    expect(screen.getByText("(c) Tester")).toBeInTheDocument();
  });

  it("사진을 탭하면 확대 모달이 열린다", async () => {
    const user = userEvent.setup();
    render(<BirdCard species={species()} />);
    await user.click(screen.getByRole("button", { name: "새 사진 확대" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("사진이 없으면 자리 표시를 보여 준다", () => {
    render(<BirdCard species={species({ media: [] })} />);
    expect(screen.getByText("사진 없음")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
