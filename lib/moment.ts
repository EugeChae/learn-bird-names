// ─── 하루의 순간 (STORY-017 · 새의 하루) ─────────────────────────────────────
//
// 사용자의 시계로 새벽·한낮·해질녘 중 하나만 보여준다. 뒤집기·탭·"다른 시간 보기"는
// 없다(사용자: "귀찮다"). 놓친 순간은 놓친 것 — 내일은 다른 새다.
// 경계는 고정으로 시작한다(cleor 결정 2026-09-25). 겨울 해질녘이 17시 전이라
// 어색하면 계절별 경계로 바꾸되, 이 파일만 바꾸면 된다.

export type Moment = "dawn" | "day" | "dusk";

export const MOMENTS: readonly Moment[] = ["dawn", "day", "dusk"];

/** 순간 시작 시각(로컬, 시). dusk는 17시부터 다음 날 dawn 시작 전까지. */
export const MOMENT_BOUNDS = { dawn: 5, day: 10, dusk: 17 } as const;

export const MOMENT_KO: Record<Moment, string> = {
  dawn: "새벽",
  day: "한낮",
  dusk: "해질녘",
};

/** 시(0~23) → 순간. */
export function momentOfHour(hour: number): Moment {
  if (hour >= MOMENT_BOUNDS.dawn && hour < MOMENT_BOUNDS.day) return "dawn";
  if (hour >= MOMENT_BOUNDS.day && hour < MOMENT_BOUNDS.dusk) return "day";
  return "dusk";
}

/** 날짜(로컬 시간) → 순간. */
export function momentOf(date: Date): Moment {
  return momentOfHour(date.getHours());
}

export function isMoment(value: unknown): value is Moment {
  return value === "dawn" || value === "day" || value === "dusk";
}
