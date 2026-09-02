import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizModePicker from "@/components/QuizModePicker";

describe("QuizModePicker", () => {
  it("처음에는 퀴즈 시작 버튼만 보여 준다", () => {
    render(<QuizModePicker includeId="pica-serica" />);
    expect(screen.getByRole("button", { name: "퀴즈 시작" })).toBeInTheDocument();
    expect(screen.queryByLabelText("퀴즈 모드 선택")).toBeNull();
  });

  it("시작을 누르면 모드를 고르고, 두 모드 모두 오늘의 새를 넘긴다", async () => {
    const user = userEvent.setup();
    render(<QuizModePicker includeId="pica-serica" />);
    await user.click(screen.getByRole("button", { name: "퀴즈 시작" }));
    const group = screen.getByRole("group", { name: "퀴즈 모드 선택" });
    expect(group).toBeInTheDocument();
    const photoToName = screen.getByRole("link", { name: /사진 보고 이름 맞히기/ });
    expect(photoToName).toHaveAttribute("href", "/quiz?include=pica-serica");
    const nameToPhoto = screen.getByRole("link", { name: /이름 보고 사진 맞히기/ });
    expect(nameToPhoto).toHaveAttribute(
      "href",
      "/quiz?mode=name-to-photo&include=pica-serica"
    );
    expect(screen.getByRole("button", { name: /분류 맞히기/ })).toBeDisabled();
  });

  it("분류 모드 잠금 시 정답 진행도(N/20)를 보여 준다", async () => {
    const user = userEvent.setup();
    render(
      <QuizModePicker
        includeId="pica-serica"
        taxonomy={{ unlocked: false, correct: 7 }}
      />
    );
    await user.click(screen.getByRole("button", { name: "퀴즈 시작" }));
    const btn = screen.getByRole("button", { name: /분류 맞히기/ });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/7\/20/);
  });

  it("잠금 해제 시 분류 퀴즈 링크와 해제 알림을 보여 준다", async () => {
    const user = userEvent.setup();
    render(
      <QuizModePicker
        includeId="pica-serica"
        taxonomy={{ unlocked: true, correct: 20 }}
      />
    );
    await user.click(screen.getByRole("button", { name: "퀴즈 시작" }));
    const link = screen.getByRole("link", { name: /분류 맞히기/ });
    expect(link).toHaveAttribute("href", "/quiz?mode=taxonomy");
    expect(screen.getByText(/잠금 해제/)).toBeInTheDocument();
  });
});
