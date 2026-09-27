import { describe, it, expect } from "vitest";
import type { Species } from "@/types";
import {
  seasonOf,
  seasonOfMonth,
  isInSeason,
  primaryStatusFor,
  SEASON_STATUS,
} from "./season";

function sp(status: Species["status"]): Species {
  return {
    id: status.join("-"),
    name_korean: "x",
    name_latin: "x",
    name_english: "x",
    order: "O",
    family: "F",
    habitat: [],
    difficulty_tier: 1,
    abundance: "c",
    status,
    media: [],
    trivia: [],
  };
}

describe("season", () => {
  it("월 → 계절 (3~5 봄, 6~8 여름, 9~11 가을, 12·1·2 겨울)", () => {
    expect(seasonOfMonth(3)).toBe("spring");
    expect(seasonOfMonth(5)).toBe("spring");
    expect(seasonOfMonth(6)).toBe("summer");
    expect(seasonOfMonth(8)).toBe("summer");
    expect(seasonOfMonth(9)).toBe("autumn");
    expect(seasonOfMonth(11)).toBe("autumn");
    expect(seasonOfMonth(12)).toBe("winter");
    expect(seasonOfMonth(1)).toBe("winter");
    expect(seasonOfMonth(2)).toBe("winter");
  });

  it("날짜 → 계절 (로컬 월 기준)", () => {
    expect(seasonOf(new Date(2026, 8, 25))).toBe("autumn"); // 9월
    expect(seasonOf(new Date(2026, 0, 15))).toBe("winter");
  });

  it("여름철새는 겨울에 없고, 겨울철새는 여름에 없다", () => {
    expect(isInSeason(sp(["SV"]), "winter")).toBe(false);
    expect(isInSeason(sp(["SV"]), "summer")).toBe(true);
    expect(isInSeason(sp(["WV"]), "summer")).toBe(false);
    expect(isInSeason(sp(["WV"]), "winter")).toBe(true);
  });

  it("텃새는 사계절, 나그네새는 봄·가을만", () => {
    for (const s of Object.keys(SEASON_STATUS) as (keyof typeof SEASON_STATUS)[]) {
      expect(isInSeason(sp(["Res"]), s)).toBe(true);
    }
    expect(isInSeason(sp(["PM"]), "spring")).toBe(true);
    expect(isInSeason(sp(["PM"]), "autumn")).toBe(true);
    expect(isInSeason(sp(["PM"]), "summer")).toBe(false);
    expect(isInSeason(sp(["PM"]), "winter")).toBe(false);
  });

  it("복수 status면 하나라도 계절에 맞으면 있는 것", () => {
    expect(isInSeason(sp(["WV", "Res"]), "summer")).toBe(true);
  });

  it("primaryStatusFor: 계절에 맞는 status를 앞세우고, 없으면 첫 번째", () => {
    expect(primaryStatusFor(sp(["WV", "Res"]), "summer")).toBe("Res");
    expect(primaryStatusFor(sp(["WV", "Res"]), "winter")).toBe("WV");
    expect(primaryStatusFor(sp(["SV"]), "winter")).toBe("SV");
  });
});
