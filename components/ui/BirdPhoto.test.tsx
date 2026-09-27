import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BirdPhoto from "./BirdPhoto";

describe("BirdPhoto", () => {
  it("로드 전에는 자리표시자, 로드 후 사진이 보인다", () => {
    const { container } = render(<BirdPhoto src="https://x/a.jpg" alt="까치" className="h-10" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.dataset.photoPhase).toBe("loading");
    const img = screen.getByRole("img", { name: "까치" });
    expect(img).toHaveAttribute("src", "https://x/a.jpg");
    expect(img.className).toContain("opacity-0");
    fireEvent.load(img);
    expect(box.dataset.photoPhase).toBe("loaded");
    expect(img.className).toContain("opacity-100");
  });

  it("src가 바뀌면 다시 자리표시자로 돌아간다 (문제가 넘어갔다는 신호)", () => {
    const { container, rerender } = render(<BirdPhoto src="https://x/a.jpg" alt="새" />);
    const box = container.firstElementChild as HTMLElement;
    fireEvent.load(screen.getByRole("img"));
    expect(box.dataset.photoPhase).toBe("loaded");
    rerender(<BirdPhoto src="https://x/b.jpg" alt="새" />);
    expect(box.dataset.photoPhase).toBe("loading");
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://x/b.jpg");
  });

  it("실패하면 같은 자리에 안내 문구", () => {
    const { container } = render(<BirdPhoto src="https://x/broken.jpg" alt="새" />);
    fireEvent.error(screen.getByRole("img"));
    expect((container.firstElementChild as HTMLElement).dataset.photoPhase).toBe("error");
    expect(screen.getByRole("img", { name: "새 (불러오기 실패)" })).toBeInTheDocument();
  });

  it("priority면 eager, 아니면 lazy", () => {
    const { rerender } = render(<BirdPhoto src="a" alt="새" priority />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager");
    rerender(<BirdPhoto src="a" alt="새" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
  });
});
