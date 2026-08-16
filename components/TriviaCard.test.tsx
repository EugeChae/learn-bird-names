import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TriviaCard, { pickTrivia, TRIVIA_TYPE_LABEL } from "@/components/TriviaCard";
import type { SpeciesTrivia } from "@/types";

const LONG_SOURCE =
  "Wikipedia, \"Oriental magpie\" (en), 2026-08 확인 — 아주 긴 출처 문자열입니다.";

function trivia(overrides: Partial<SpeciesTrivia> = {}): SpeciesTrivia {
  return {
    content: "까치는 어깨의 흰 반점이 식별 포인트다.",
    type: "identification",
    trivia_source: LONG_SOURCE,
    ...overrides,
  };
}

describe("pickTrivia", () => {
  it("빈 목록이면 undefined", () => {
    expect(pickTrivia([])).toBeUndefined();
  });

  it("여러 개면 rng로 하나를 고른다", () => {
    const items: SpeciesTrivia[] = [
      trivia({ content: "a", type: "ecology" }),
      trivia({ content: "b", type: "seasonal" }),
      trivia({ content: "c", type: "identification" }),
    ];
    expect(pickTrivia(items, () => 0)?.content).toBe("a");
    expect(pickTrivia(items, () => 0.99)?.content).toBe("c");
  });
});

describe("TriviaCard", () => {
  it("내용과 유형 뱃지를 한국어로 보여 준다", () => {
    render(<TriviaCard trivia={trivia({ type: "ecology" })} />);
    expect(screen.getByText(/어깨의 흰 반점/)).toBeInTheDocument();
    expect(screen.getByText(TRIVIA_TYPE_LABEL.ecology)).toBeInTheDocument();
  });

  it.each([
    ["identification", "식별"],
    ["ecology", "생태"],
    ["seasonal", "계절"],
  ] as const)("%s → %s", (type, label) => {
    render(<TriviaCard trivia={trivia({ type })} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("출처는 접혀 있고, 탭하면 전체가 펼쳐진다", async () => {
    const user = userEvent.setup();
    render(<TriviaCard trivia={trivia()} />);
    const toggle = screen.getByRole("button", { name: /출처/ });
    const label = toggle.querySelector("span");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(label?.className).toMatch(/line-clamp-1/);
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(label?.className).not.toMatch(/line-clamp-1/);
    expect(toggle).toHaveTextContent(LONG_SOURCE);
  });
});
