import type { SRSQuality, SpeciesProgress } from "@/types";

// ─── SRSEngine · SM-2 경량 구현 ────────────────────────────────────────────────
//
// SM-2(SuperMemo 2) 알고리즘을 이 앱의 품질 척도에 맞게 경량화한 순수 함수.
// 사이드 이펙트 없음 — now를 주입하면 완전히 결정론적이라 테스트가 쉽다.
//
// 품질(SRSQuality) 척도와 간격 정책:
//   0 (오답)          → interval 0으로 초기화. 오늘 다시 복습 대상으로 남긴다.
//   1,2 (재시도/힌트)  → 소폭 증가(선형 +1). 도움받아 맞혔으므로 신중하게 늘린다.
//   3~5 (1번에 정답)   → 표준 증가(기하급수 사다리 1→6→×EF). 확신 있게 맞혔으므로 크게 늘린다.
//
// EF(난이도 계수)는 품질과 무관하게 항상 SM-2 공식으로 갱신하며, 1.3 미만으로
// 내려가지 않는다(하한 보장).

/** SM-2 표준 초기 난이도 계수. 새 종의 progress 초기화 시 사용(ProgressService). */
export const DEFAULT_EASINESS_FACTOR = 2.5;

/** 난이도 계수 하한. 이 값 아래로는 절대 내려가지 않는다. */
export const MIN_EASINESS_FACTOR = 1.3;

const FIRST_INTERVAL = 1; // 첫 정답 후 1일
const SECOND_INTERVAL = 6; // 두 번째 정답 후 6일

/** calculate 입력에 필요한 이전 SRS 상태(SpeciesProgress의 구조적 부분집합). */
export type SRSState = Pick<SpeciesProgress, "easiness_factor" | "interval_days">;

/** calculate가 돌려주는 갱신된 SRS 필드. */
export interface SRSUpdate {
  easiness_factor: number;
  interval_days: number;
  next_review: string; // ISO 8601
}

/** SM-2 EF 갱신 공식. 결과는 1.3 하한으로 클램프한다. */
function updateEasiness(ef: number, q: SRSQuality): number {
  const next = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(MIN_EASINESS_FACTOR, next);
}

/** q>=3(1번에 정답)일 때의 표준 SM-2 사다리. */
function standardInterval(prev: number, ef: number): number {
  if (prev <= 0) return FIRST_INTERVAL;
  if (prev < SECOND_INTERVAL) return SECOND_INTERVAL;
  return Math.round(prev * ef);
}

/** now + days 를 UTC 기준으로 계산해 ISO 문자열로 반환(월/년 경계 자동 처리). */
function addDays(now: Date, days: number): string {
  const next = new Date(now.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

/**
 * 이전 SRS 상태와 이번 응답 품질로 다음 EF · interval · 복습일을 계산한다.
 * @param prev    이전 상태(easiness_factor, interval_days). 새 종은 DEFAULT_EASINESS_FACTOR로 초기화된 상태를 넘긴다.
 * @param quality 이번 응답 품질(0~5).
 * @param now     기준 시각. 주입하면 결정론적(기본값은 현재 시각).
 */
export function calculate(
  prev: SRSState,
  quality: SRSQuality,
  now: Date = new Date()
): SRSUpdate {
  const easiness_factor = updateEasiness(prev.easiness_factor, quality);
  const prevInterval = prev.interval_days;

  let interval_days: number;
  if (quality === 0) {
    interval_days = 0; // 오답 → 초기화
  } else if (quality <= 2) {
    // 재시도/힌트 정답 → 소폭 증가(선형)
    interval_days = prevInterval <= 0 ? FIRST_INTERVAL : prevInterval + 1;
  } else {
    // 1번에 정답 → 표준 증가(기하급수)
    interval_days = standardInterval(prevInterval, easiness_factor);
  }

  return {
    easiness_factor,
    interval_days,
    next_review: addDays(now, interval_days),
  };
}
