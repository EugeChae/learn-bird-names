import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MatchingGame from "@/components/MatchingGame";
import type { MatchingPair, Species } from "@/types";

function sp(id: string, name: string): Species {
  return {
    id,
    name_korean: name,
    name_latin: id,
    name_english: id,
    order: "O",
    family: "F",
    habitat: [],
    difficulty_tier: 1,
    abundance: "c",
    status: ["Res"],
    media: [
      {
        url: `https://x/${id}.jpg`,
        sex: "unknown",
        age: "adult",
        plumage: "unknown",
        angle: "unknown",
        license: "CC",
        attribution: "a",
        quality_score: 2,
      },
    ],
    trivia: [],
  };
}

function pair(id: string, name: string, wasEasy = false): MatchingPair {
  return { species: sp(id, name), matched: false, wasEasy };
}

const photoBtn = (id: string): HTMLElement =>
  screen
    .getByRole("list", { name: "사진" })
    .querySelector(`[data-species-id="${id}"]`) as HTMLElement;

const nameBtn = (id: string): HTMLElement =>
  screen
    .getByRole("list", { name: "이름" })
    .querySelector(`[data-species-id="${id}"]`) as HTMLElement;

describe("MatchingGame", () => {
  it("wasEasy 종은 처음부터 완료(비활성)로 시작한다 (AC3)", () => {
    render(
      <MatchingGame
        pairs={[
          pair("magpie", "까치", true),
          pair("sparrow", "참새"),
          pair("tit", "박새"),
        ]}
        onComplete={() => {}}
      />
    );
    // 이미 1/3 완료(까치)
    expect(screen.getByText(/1 \/ 3 짝/)).toBeInTheDocument();
    expect(photoBtn("magpie")).toBeDisabled();
    expect(nameBtn("magpie")).toBeDisabled();
    expect(photoBtn("sparrow")).toBeEnabled();
  });

  it("사진 → 같은 종 이름을 탭하면 매치되어 잠긴다", async () => {
    const user = userEvent.setup();
    render(
      <MatchingGame
        pairs={[pair("magpie", "까치", true), pair("sparrow", "참새"), pair("tit", "박새")]}
        onComplete={() => {}}
      />
    );
    await user.click(photoBtn("sparrow"));
    await user.click(nameBtn("sparrow"));
    expect(photoBtn("sparrow")).toBeDisabled();
    expect(nameBtn("sparrow")).toBeDisabled();
    expect(screen.getByText(/2 \/ 3 짝/)).toBeInTheDocument();
  });

  it("사진 → 다른 종 이름을 탭하면 매치되지 않고 경고를 보인다", async () => {
    const user = userEvent.setup();
    render(
      <MatchingGame
        pairs={[pair("magpie", "까치", true), pair("sparrow", "참새"), pair("tit", "박새")]}
        onComplete={() => {}}
      />
    );
    await user.click(photoBtn("sparrow"));
    await user.click(nameBtn("tit"));
    expect(screen.getByText(/짝이 아니에요/)).toBeInTheDocument();
    expect(photoBtn("sparrow")).toBeEnabled();
    expect(screen.getByText(/1 \/ 3 짝/)).toBeInTheDocument();
  });

  it("남은 종을 모두 맞추면 onComplete를 부른다 (AC4)", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <MatchingGame
        pairs={[pair("magpie", "까치", true), pair("sparrow", "참새"), pair("tit", "박새")]}
        onComplete={onComplete}
      />
    );
    await user.click(photoBtn("sparrow"));
    await user.click(nameBtn("sparrow"));
    await user.click(photoBtn("tit"));
    await user.click(nameBtn("tit"));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("모든 종이 wasEasy면 마운트 즉시 onComplete를 부른다", () => {
    const onComplete = vi.fn();
    render(
      <MatchingGame
        pairs={[pair("magpie", "까치", true), pair("sparrow", "참새", true)]}
        onComplete={onComplete}
      />
    );
    expect(onComplete).toHaveBeenCalled();
  });
});
