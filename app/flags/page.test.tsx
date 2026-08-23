import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlagsPage from "@/app/flags/page";
import { flagPhoto, getFlags } from "@/lib/photoFlags.store";

beforeEach(() => {
  window.localStorage.clear();
});

describe("FlagsPage", () => {
  it("플래그가 없으면 안내 문구를 보여준다", async () => {
    render(<FlagsPage />);
    expect(
      await screen.findByText(/변경요청한 사진이 없어요/)
    ).toBeInTheDocument();
  });

  it("저장된 플래그를 목록으로 보여주고 개별 제거할 수 있다", async () => {
    flagPhoto({
      speciesId: "pica-serica",
      nameKorean: "까치",
      photoUrl: "https://example.com/magpie.jpg",
    });
    render(<FlagsPage />);

    expect(await screen.findByText("까치")).toBeInTheDocument();
    expect(screen.getByText("총 1건")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /까치 변경요청 제거/ })
    );
    expect(screen.queryByText("까치")).not.toBeInTheDocument();
    expect(getFlags()).toEqual([]);
  });
});
