import { describe, it, expect } from "vitest";
import {
  getReports,
  addReport,
  removeReport,
  clearReports,
  createReportStore,
  DATA_REPORTS_STORAGE_KEY,
  REPORT_CATEGORIES,
  type ReportDeps,
} from "@/lib/dataReports.store";
import { createFakeStorage } from "@/lib/localStorage.adapter";

const NOW = new Date("2026-09-15T09:00:00.000Z");

function deps(storage = createFakeStorage()): ReportDeps {
  let n = 0;
  return {
    store: createReportStore(storage),
    now: NOW,
    makeId: () => `r${++n}`,
  };
}

const MAGPIE_WRONG = {
  speciesId: "pica-serica",
  nameKorean: "까치",
  category: "wrong-species" as const,
  detail: "사진 속 새는 물까치로 보여요",
  page: "/quiz",
};

describe("dataReports.store · addReport", () => {
  it("신고를 추가하고 id·reportedAt을 채운다", () => {
    const d = deps();
    const { added, reports } = addReport(MAGPIE_WRONG, d);
    expect(added).toMatchObject({ ...MAGPIE_WRONG, id: "r1" });
    expect(added?.reportedAt).toBe(NOW.toISOString());
    expect(reports).toHaveLength(1);
    expect(getReports(d)).toEqual(reports);
  });

  it("detail이 공백뿐이면 저장하지 않는다", () => {
    const d = deps();
    const { added, reports } = addReport({ ...MAGPIE_WRONG, detail: "   " }, d);
    expect(added).toBeNull();
    expect(reports).toEqual([]);
  });

  it("detail 앞뒤 공백은 정리한다", () => {
    const d = deps();
    const { added } = addReport({ ...MAGPIE_WRONG, detail: "  틀렸어요  " }, d);
    expect(added?.detail).toBe("틀렸어요");
  });

  it("같은 종에 대한 신고도 여러 건 쌓인다(플래그와 달리 중복 허용)", () => {
    const d = deps();
    addReport(MAGPIE_WRONG, d);
    addReport({ ...MAGPIE_WRONG, category: "wrong-info", detail: "서식지" }, d);
    expect(getReports(d).map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("종과 무관한 신고(speciesId 빈 문자열)도 허용한다", () => {
    const d = deps();
    const { added } = addReport(
      { ...MAGPIE_WRONG, speciesId: "", nameKorean: "", detail: "전체적으로" },
      d
    );
    expect(added?.speciesId).toBe("");
  });
});

describe("dataReports.store · remove / clear", () => {
  it("removeReport는 해당 id만 지운다", () => {
    const d = deps();
    addReport(MAGPIE_WRONG, d);
    addReport({ ...MAGPIE_WRONG, detail: "둘째" }, d);
    removeReport("r1", d);
    expect(getReports(d).map((r) => r.detail)).toEqual(["둘째"]);
  });

  it("clearReports는 전부 비운다", () => {
    const d = deps();
    addReport(MAGPIE_WRONG, d);
    clearReports(d);
    expect(getReports(d)).toEqual([]);
  });
});

describe("dataReports.store · 손상 복구", () => {
  it("JSON이 깨졌으면 빈 배열", () => {
    const d = deps(createFakeStorage({ [DATA_REPORTS_STORAGE_KEY]: "{oops" }));
    expect(getReports(d)).toEqual([]);
  });

  it("모양이 틀린 항목은 걸러낸다", () => {
    const good = {
      id: "a",
      speciesId: "x",
      nameKorean: "x",
      category: "other",
      detail: "d",
      page: "/",
      reportedAt: "2026-09-15T00:00:00.000Z",
    };
    const bad = { ...good, id: "b", category: "not-a-category" };
    const d = deps(
      createFakeStorage({
        [DATA_REPORTS_STORAGE_KEY]: JSON.stringify([good, bad, 42, null]),
      })
    );
    expect(getReports(d).map((r) => r.id)).toEqual(["a"]);
  });

  it("REPORT_CATEGORIES는 라벨과 1:1이다", () => {
    expect(REPORT_CATEGORIES).toContain("wrong-species");
    expect(REPORT_CATEGORIES).toContain("other");
  });
});
