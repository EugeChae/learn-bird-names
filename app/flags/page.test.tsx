import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlagsPage from "@/app/flags/page";
import { flagPhoto, getFlags } from "@/lib/photoFlags.store";
import { addReport, getReports } from "@/lib/dataReports.store";

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

  it("데이터 오류 신고를 목록으로 보여주고 개별 제거할 수 있다", async () => {
    addReport({
      speciesId: "corvus-corone",
      nameKorean: "까마귀",
      category: "wrong-species",
      detail: "사진은 큰부리까마귀 같아요",
      page: "/quiz",
    });
    render(<FlagsPage />);

    expect(await screen.findByText("신고 1건")).toBeInTheDocument();
    expect(screen.getByText("사진은 큰부리까마귀 같아요")).toBeInTheDocument();
    expect(screen.getByText(/사진 속 새가 다른 종이에요/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /까마귀 신고 제거/ }));
    expect(screen.queryByText("신고 1건")).not.toBeInTheDocument();
    expect(getReports()).toEqual([]);
  });
});
