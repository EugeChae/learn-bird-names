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
    {
      content: "지금쯤 마을 어귀에서 둥지 재료를 나르고 있다.",
      type: "ecology",
      trivia_source: "테스트 출처",
    },
  ],
};

vi.mock("@/services/species.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/species.service")>(
    "@/services/species.service"
  );
  return { ...actual, getBirdOfTheDay: vi.fn(), getById: vi.fn() };
});

import { getBirdOfTheDay, getById } from "@/services/species.service";
import Home from "@/app/page";

describe("Home · 오늘 만날 새", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(getBirdOfTheDay).mockReturnValue(BIRD);
    vi.mocked(getById).mockImplementation((id) => (id === BIRD.id ? BIRD : undefined));
  });

  it("오늘의 종 사진·이름·생활 트리비아·계절 안내와 퀴즈 시작을 보여 준다", async () => {
    render(<Home />);
    expect(await screen.findByRole("heading", { name: "까치" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "오늘 만날 새" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "까치" })).toBeInTheDocument();
    expect(screen.getByLabelText("오늘의 트리비아")).toBeInTheDocument();
    // 식별형은 홈에 올리지 않는다 → 생태 문장이 보인다
    expect(screen.getByText("생태")).toBeInTheDocument();
    expect(screen.queryByText("식별")).not.toBeInTheDocument();
    expect(screen.getByLabelText("계절 안내")).toHaveTextContent("늘 여기 있어요");
    expect(screen.getByRole("button", { name: "퀴즈 시작" })).toBeInTheDocument();
  });

  it("오늘의 새를 기록하고, 두 번째 방문은 기록된 종을 그대로 쓴다", async () => {
    render(<Home />);
    await screen.findByRole("heading", { name: "까치" });
    expect(getBirdOfTheDay).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(window.localStorage.getItem("learn-bird-names:bird-of-the-day") ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0].speciesId).toBe("pica-serica");

    render(<Home />);
    await screen.findAllByRole("heading", { name: "까치" });
    expect(getBirdOfTheDay).toHaveBeenCalledTimes(1); // 기록이 있으면 다시 뽑지 않는다
    expect(getById).toHaveBeenCalledWith("pica-serica");
  });

  it("순간별 열람을 센다", async () => {
    render(<Home />);
    await screen.findByRole("heading", { name: "까치" });
    const views = JSON.parse(window.localStorage.getItem("learn-bird-names:moment-views") ?? "{}");
    expect(views.dawn + views.day + views.dusk).toBe(1);
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
