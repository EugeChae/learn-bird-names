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

  it("시작을 누르면 모드를 고르고, 사진→이름은 오늘의 새를 넘긴다", async () => {
    const user = userEvent.setup();
    render(<QuizModePicker includeId="pica-serica" />);
    await user.click(screen.getByRole("button", { name: "퀴즈 시작" }));
    const group = screen.getByRole("group", { name: "퀴즈 모드 선택" });
    expect(group).toBeInTheDocument();
    const photoToName = screen.getByRole("link", { name: /사진 보고 이름 맞히기/ });
    expect(photoToName).toHaveAttribute("href", "/quiz?include=pica-serica");
    expect(screen.getByRole("button", { name: /이름 보고 사진 맞히기/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /분류 맞히기/ })).toBeDisabled();
  });
});
