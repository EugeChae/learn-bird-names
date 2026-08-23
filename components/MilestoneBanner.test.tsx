import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MilestoneBanner from "@/components/MilestoneBanner";

describe("MilestoneBanner", () => {
  it("5연속과 10연속 메시지가 서로 다르다", () => {
    const { rerender } = render(<MilestoneBanner streak={5} />);
    expect(screen.getByText(/5연속 정답/)).toBeInTheDocument();
    rerender(<MilestoneBanner streak={10} />);
    expect(screen.getByText(/10연속 정답/)).toBeInTheDocument();
    expect(screen.getByText(/최고예요/)).toBeInTheDocument();
  });

  it("등장 애니메이션 클래스를 갖고, reduced-motion에서는 끈다", () => {
    render(<MilestoneBanner streak={5} />);
    const el = screen.getByText(/5연속 정답/);
    expect(el.className).toContain("animate-milestone-pop");
    expect(el.className).toContain("motion-reduce:animate-none");
  });
});
