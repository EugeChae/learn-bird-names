import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataReportForm from "@/components/DataReportForm";
import {
  createReportStore,
  getReports,
  type ReportDeps,
} from "@/lib/dataReports.store";
import { createFakeStorage } from "@/lib/localStorage.adapter";

const NOW = new Date("2026-09-15T09:00:00.000Z");
const OPTIONS = [
  { id: "pica-serica", nameKorean: "까치" },
  { id: "passer-montanus", nameKorean: "참새" },
];

function deps(): ReportDeps {
  return { store: createReportStore(createFakeStorage()), now: NOW, makeId: () => "r1" };
}

describe("DataReportForm", () => {
  it("종 이름을 id로 매칭해 신고를 저장하고 확인 문구를 보여준다", async () => {
    const d = deps();
    render(<DataReportForm deps={d} speciesOptions={OPTIONS} page="/quiz" />);

    await userEvent.type(screen.getByLabelText(/어떤 새인가요/), "까치");
    await userEvent.click(screen.getByLabelText(/이름·학명이 틀렸어요/));
    await userEvent.type(screen.getByLabelText(/자세히 알려주세요/), "학명 오타");
    await userEvent.click(screen.getByRole("button", { name: "신고 저장" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/저장됐어요/);
    expect(getReports(d)).toEqual([
      {
        id: "r1",
        speciesId: "pica-serica",
        nameKorean: "까치",
        category: "wrong-name",
        detail: "학명 오타",
        page: "/quiz",
        reportedAt: NOW.toISOString(),
      },
    ]);
    // 저장 후 설명란은 비워져 연속 신고가 쉽다.
    expect(screen.getByLabelText(/자세히 알려주세요/)).toHaveValue("");
  });

  it("목록에 없는 이름은 speciesId 없이 이름만 저장한다", async () => {
    const d = deps();
    render(<DataReportForm deps={d} speciesOptions={OPTIONS} page="/" />);

    await userEvent.type(screen.getByLabelText(/어떤 새인가요/), "없는새");
    expect(screen.getByText(/목록에 없는 이름이에요/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/자세히 알려주세요/), "추가해 주세요");
    await userEvent.click(screen.getByRole("button", { name: "신고 저장" }));

    expect(getReports(d)[0]).toMatchObject({
      speciesId: "",
      nameKorean: "없는새",
      category: "wrong-species",
    });
  });

  it("설명이 비어 있으면 저장하지 않고 안내한다", async () => {
    const d = deps();
    render(<DataReportForm deps={d} speciesOptions={OPTIONS} page="/" />);

    await userEvent.click(screen.getByRole("button", { name: "신고 저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/설명을 한 줄이라도/);
    expect(getReports(d)).toEqual([]);
  });
});
