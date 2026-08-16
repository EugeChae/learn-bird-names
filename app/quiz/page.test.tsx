import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizPage, { createQuizSession } from "@/app/quiz/page";
import { PROGRESS_STORAGE_KEY } from "@/lib/localStorage.adapter";
import { getAllProgress } from "@/services/progress.service";
import { getAll } from "@/services/species.service";

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
