import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import QuizScopePicker from "@/components/QuizScopePicker";
import type { ScopeAvailability } from "@/lib/quiz-session";

const AVAIL: ScopeAvailability = {
  weak: 6,
  review: 0,
  habitats: [
    { habitat: "도시·마을", count: 7 },
    { habitat: "산·숲", count: 4 },
  ],
};

describe("QuizScopePicker", () => {
  it("취약종 범위를 링크로, 가용 종 수와 함께 보여 준다", () => {
    render(<QuizScopePicker availability={AVAIL} />);
    const weak = screen.getByRole("link", { name: /취약종만/ });
    expect(weak).toHaveAttribute("href", "/quiz?scope=weak");
    expect(weak).toHaveTextContent("6종");
    expect(weak).not.toHaveTextContent(/5종 미만/);
  });

  it("범위 내 종이 0이면 링크 대신 비활성 안내를 보여 준다", () => {
    render(<QuizScopePicker availability={AVAIL} />);
    expect(
      screen.queryByRole("link", { name: /오늘 복습 대상/ })
    ).toBeNull();
    expect(screen.getByText(/학습할 새가 없어요/)).toBeInTheDocument();
  });

  it("범위 내 종이 5개 미만이면 경고 문구를 보여 준다 (AC2)", () => {
    render(<QuizScopePicker availability={AVAIL} />);
    const forest = screen.getByRole("link", { name: /산·숲/ });
    expect(forest).toHaveTextContent(/5종 미만/);
    const urban = screen.getByRole("link", { name: /도시·마을/ });
    expect(urban).not.toHaveTextContent(/5종 미만/);
  });

  it("서식지 링크는 scope=habitat과 habitat 파라미터를 담는다", () => {
    render(<QuizScopePicker availability={AVAIL} />);
    const urban = screen.getByRole("link", { name: /도시·마을/ });
    expect(urban).toHaveAttribute(
      "href",
      "/quiz?scope=habitat&habitat=" + encodeURIComponent("도시·마을")
    );
  });
});
