import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizPage from "@/app/quiz/page";
import { createQuizSession } from "@/lib/quiz-session";
import { PROGRESS_STORAGE_KEY } from "@/lib/localStorage.adapter";
import { getAllProgress } from "@/services/progress.service";
import { getAll } from "@/services/species.service";

/** localStorage에 n종을 "정답 1회 이상"으로 시드한다(분류 잠금 해제 판정용). */
function seedCorrectSpecies(n: number) {
  const ids = getAll()
    .map((s) => s.id)
    .slice(0, n);
  const prog: Record<string, unknown> = {};
  for (const id of ids) {
    prog[id] = {
      correct_count: 1,
      incorrect_count: 0,
      last_seen: "2025-01-01T00:00:00.000Z",
      next_review: "2025-01-01T00:00:00.000Z",
      easiness_factor: 2.5,
      interval_days: 0,
      last_quality: 3,
      consecutive_correct: 1,
    };
  }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(prog));
}

describe("QuizPage · 진도 손상 안내", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("손상된 진도가 있으면 초기화 모달을 보여 준다", async () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, "{broken");
    render(<QuizPage />);
    expect(
      await screen.findByRole("dialog", { name: /학습 진도를 불러올 수 없어요/ })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("사진 이름 맞히기 퀴즈")).toBeNull();
  });

  it("초기화하면 손상 데이터를 지우고 퀴즈를 시작한다", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, "{broken");
    render(<QuizPage />);
    await user.click(await screen.findByRole("button", { name: "진도 초기화" }));
    expect(getAllProgress()).toEqual({});
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      await screen.findByLabelText("사진 이름 맞히기 퀴즈")
    ).toBeInTheDocument();
  });
});

describe("QuizPage · 분류 모드 잠금 (STORY-014 AC1)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/quiz?mode=taxonomy");
  });
  afterEach(() => {
    window.history.replaceState(null, "", "/quiz");
  });

  it("누적 정답 20종 미만이면 URL 직접 진입도 잠금 안내로 막는다", async () => {
    seedCorrectSpecies(5);
    render(<QuizPage />);
    expect(await screen.findByText(/분류 퀴즈는/)).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 20/)).toBeInTheDocument();
    expect(screen.queryByLabelText("분류 퀴즈")).toBeNull();
  });

  it("누적 정답 20종 이상이면 분류 퀴즈가 열린다", async () => {
    seedCorrectSpecies(20);
    render(<QuizPage />);
    expect(await screen.findByLabelText("분류 퀴즈")).toBeInTheDocument();
    expect(screen.queryByText(/분류 퀴즈는/)).toBeNull();
  });
});

describe("createQuizSession", () => {
  it("include id가 있으면 그 종이 세션에 들어간다", () => {
    const ids = getAll().map((s) => s.id);
    expect(ids.length).toBeGreaterThan(0);
    const focus = ids[ids.length - 1];
    const session = createQuizSession(focus);
    expect(session.questions.map((q) => q.species.id)).toContain(focus);
  });

  it("없는 id면 전체 풀로 만든다", () => {
    const session = createQuizSession("not-a-bird");
    expect(session.questions.length).toBeGreaterThan(0);
  });
});
