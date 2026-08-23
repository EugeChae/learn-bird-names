import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProgressBoard from "@/components/ProgressBoard";
import type { ProgressSummary } from "@/services/progress.service";
import type { Species } from "@/types";

function sp(id: string, name: string): Species {
  return {
    id,
    name_korean: name,
    name_latin: id,
    name_english: id,
    order: "Passeriformes",
    family: "Corvidae",
    habitat: [],
    difficulty_tier: 1,
    abundance: "c",
    status: ["Res"],
    media: [],
    trivia: [],
  };
}

const SUMMARY: ProgressSummary = {
  learned: 5,
  total: 12,
  mastered: 2,
  weak: [
    { species: sp("magpie", "까치"), missRate: 0.75, incorrect: 3, attempts: 4 },
    { species: sp("crow", "큰부리까마귀"), missRate: 0.5, incorrect: 1, attempts: 2 },
  ],
};

describe("ProgressBoard", () => {
  it("학습/전체 종 수와 마스터 수를 보여 준다", () => {
    render(<ProgressBoard summary={SUMMARY} onReset={() => {}} />);
    expect(screen.getByText("5")).toBeInTheDocument(); // learned
    expect(screen.getByText(/\/ 12/)).toBeInTheDocument(); // total
    expect(screen.getByText("2")).toBeInTheDocument(); // mastered
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
  });

  it("취약종을 오답률과 함께 나열한다", () => {
    render(<ProgressBoard summary={SUMMARY} onReset={() => {}} />);
    expect(screen.getByText("까치")).toBeInTheDocument();
    expect(screen.getByText("큰부리까마귀")).toBeInTheDocument();
    expect(screen.getByText(/오답률 75%/)).toBeInTheDocument();
    expect(screen.getByText(/오답률 50%/)).toBeInTheDocument();
  });

  it("취약종이 없으면 안내 문구를 보여 준다", () => {
    render(
      <ProgressBoard
        summary={{ learned: 0, total: 12, mastered: 0, weak: [] }}
        onReset={() => {}}
      />
    );
    expect(screen.getByText(/아직 취약한 새가 없어요/)).toBeInTheDocument();
  });

  it("초기화 버튼 → 확인 다이얼로그 → 확정 시 onReset을 부른다", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ProgressBoard summary={SUMMARY} onReset={onReset} />);
    await user.click(screen.getByRole("button", { name: "진도 초기화" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "초기화" }));
    expect(onReset).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("확인 다이얼로그에서 취소하면 onReset을 부르지 않는다", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ProgressBoard summary={SUMMARY} onReset={onReset} />);
    await user.click(screen.getByRole("button", { name: "진도 초기화" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "취소" })
    );
    expect(onReset).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
