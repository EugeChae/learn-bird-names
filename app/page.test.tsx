import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Species } from "@/types";

const BIRD: Species = {
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
  trivia: [
    {
      content: "어깨의 흰 반점이 식별 포인트다.",
      type: "identification",
      trivia_source: "테스트 출처",
    },
  ],
};

vi.mock("@/services/species.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/species.service")>(
    "@/services/species.service"
  );
  return { ...actual, getRandom: vi.fn() };
});

import { getRandom } from "@/services/species.service";
import Home from "@/app/page";

describe("Home · 오늘의 새", () => {
  beforeEach(() => {
    vi.mocked(getRandom).mockReturnValue(BIRD);
  });

  it("랜덤 종의 사진·이름·트리비아와 퀴즈 시작을 보여 준다", async () => {
    render(<Home />);
    expect(await screen.findByRole("heading", { name: "까치" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "오늘의 새" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "까치" })).toBeInTheDocument();
    expect(screen.getByLabelText("오늘의 트리비아")).toBeInTheDocument();
    expect(screen.getByText("식별")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "퀴즈 시작" })).toBeInTheDocument();
  });

  it("퀴즈 시작 → 모드 선택에서 오늘의 새 id를 넘긴다", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(await screen.findByRole("button", { name: "퀴즈 시작" }));
    expect(screen.getByRole("link", { name: /사진 보고 이름 맞히기/ })).toHaveAttribute(
      "href",
      "/quiz?include=pica-serica"
    );
  });
});
