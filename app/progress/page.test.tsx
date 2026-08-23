import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProgressPage from "@/app/progress/page";
import { PROGRESS_STORAGE_KEY } from "@/lib/localStorage.adapter";
import { updateProgress } from "@/services/progress.service";

describe("ProgressPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("정상 진도면 대시보드를 보여 준다", async () => {
    render(<ProgressPage />);
    expect(
      await screen.findByRole("heading", { name: "학습 진도" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("학습 진도 대시보드")).toBeInTheDocument();
  });

  it("손상된 진도가 있으면 초기화 안내 모달을 보여 준다 (AC5)", async () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, "{broken");
    render(<ProgressPage />);
    expect(
      await screen.findByRole("dialog", {
        name: /학습 진도를 불러올 수 없어요/,
      })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("학습 진도 대시보드")).toBeNull();
  });

  it("손상 안내에서 초기화하면 손상 데이터를 지우고 대시보드를 보여 준다", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, "{broken");
    render(<ProgressPage />);
    await user.click(await screen.findByRole("button", { name: "진도 초기화" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      await screen.findByLabelText("학습 진도 대시보드")
    ).toBeInTheDocument();
  });

  it("대시보드에서 초기화를 확정하면 학습 기록이 사라진다", async () => {
    const user = userEvent.setup();
    updateProgress("pica-serica", 5); // 실제 localStorage에 기록
    render(<ProgressPage />);
    await screen.findByLabelText("학습 진도 대시보드");
    await user.click(screen.getByRole("button", { name: "진도 초기화" }));
    await user.click(
      await screen.findByRole("button", { name: "초기화" })
    );
    expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
  });
});
