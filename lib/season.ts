import type { Species, Status } from "@/types";

// ─── 계절 (STORY-017 · 오늘 만날 새) ───────────────────────────────────────────
//
// "지금쯤 … 하고 있다"라는 현재형 문장을 쓰기로 했으므로, 지금 한국에 없는 새는
// 오늘의 새가 될 수 없다(정직성). 계절은 status 코드로만 판단한다 — 월별 도래 시기
// 데이터는 아직 없어서 4계절 단위가 한계다(다음 데이터 감사 과제).
// 상수를 코드에 박지 않고 여기 한 곳에 둔다.

export type Season = "spring" | "summer" | "autumn" | "winter";

/** 계절별로 한국에 있는 것으로 보는 status 코드. */
export const SEASON_STATUS: Record<Season, readonly Status[]> = {
  spring: ["Res", "SV", "PM"], // 3~5월: 텃새 + 여름철새 도착 + 나그네새 통과
  summer: ["Res", "SV"], // 6~8월
  autumn: ["Res", "SV", "WV", "PM"], // 9~11월: 여름철새 떠나는 중 + 겨울철새 도착 + 통과
  winter: ["Res", "WV"], // 12~2월
};

export const SEASON_KO: Record<Season, string> = {
  spring: "봄",
  summer: "여름",
  autumn: "가을",
  winter: "겨울",
};

/** 월(1~12) → 계절. */
export function seasonOfMonth(month: number): Season {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/** 날짜(로컬 시간 기준) → 계절. */
export function seasonOf(date: Date): Season {
  return seasonOfMonth(date.getMonth() + 1);
}

/** 이 종이 해당 계절에 한국에 있는가(status 중 하나라도 계절 목록에 있으면 true). */
export function isInSeason(species: Species, season: Season): boolean {
  const allowed = SEASON_STATUS[season];
  return species.status.some((s) => allowed.includes(s));
}

/**
 * 복수 status 중 현재 계절에 해당하는 것을 앞세운다(카드의 한 줄 안내용).
 * 예: 청둥오리 ["WV","Res"] — 여름이면 Res가 먼저.
 */
export function primaryStatusFor(species: Species, season: Season): Status | undefined {
  const allowed = SEASON_STATUS[season];
  return species.status.find((s) => allowed.includes(s)) ?? species.status[0];
}
