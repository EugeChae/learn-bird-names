import type { QuizSession, QuizMode, QuizScope, Species } from "@/types";
import { createSession } from "@/services/quiz.service";
import { getById, getAll, getHabitats } from "@/services/species.service";
import {
  getWeakSpecies,
  getDueForReview,
  ProgressCorruptedError,
} from "@/services/progress.service";

/** UI에서 진입 가능한 퀴즈 모드(taxonomy는 STORY-014). */
const ENTERABLE_MODES: readonly QuizMode[] = ["photo-to-name", "name-to-photo"];

/** URL·선택지로 진입 가능한 퀴즈 범위(STORY-016). */
const SCOPES: readonly QuizScope[] = ["all", "weak", "review", "habitat"];

/** 선택 범위 내 종이 이 값 미만이면 "문제가 적다" 경고를 띄운다(FR-018 / AC2). */
export const MIN_SCOPE_SPECIES = 5;

/** 한 세션의 문제 수. */
const SESSION_SIZE = 10;

export interface ScopeSelection {
  scope: QuizScope;
  /** scope === "habitat" 일 때 대상 서식지 태그. */
  habitat?: string | null;
}

/** scope 해석에 필요한 조회 함수들(테스트에서 주입 가능, 기본은 실서비스). */
export interface ScopeDeps {
  getAll?: () => Species[];
  getWeakSpecies?: (limit: number) => Species[];
  getDueForReview?: () => Species[];
}

/**
 * 범위에 해당하는 종 목록을 돌려준다(경고 카운트·문제 pool 공용).
 * - all: 전체 카탈로그
 * - weak: 시도 기록상 취약한 종 전부(오답률 순)
 * - review: 오늘 복습 대상(next_review ≤ now)
 * - habitat: 해당 서식지 태그를 가진 종 (habitat 미지정이면 빈 배열)
 */
export function speciesInScope(
  sel: ScopeSelection,
  deps: ScopeDeps = {}
): Species[] {
  const all = deps.getAll ?? getAll;
  switch (sel.scope) {
    case "weak":
      // limit을 전체 종 수로 주면 취약종 전부가 온다(weak ⊆ all).
      return (deps.getWeakSpecies ?? getWeakSpecies)(all().length);
    case "review":
      return (deps.getDueForReview ?? getDueForReview)();
    case "habitat":
      if (!sel.habitat) return [];
      return all().filter((s) => s.habitat.includes(sel.habitat as string));
    case "all":
    default:
      return all();
  }
}

/**
 * 세션을 만든다. 범위(scope)별 문제 pool 선택은 여기(호출부)의 관심사다 —
 * QuizService 코어는 pool 주입만 받는다(의존성 역전).
 *
 * `?include=` 종은 "전체" 범위에서만 강제 포함한다(취약종·복습·서식지 범위에
 * 오늘의 새를 억지로 끼우면 범위 계약이 깨지므로). 좁힌 범위에선 pool만 주입하고
 * 오답 보기(decoyPool)는 전체를 그대로 써 4지선다 난이도를 유지한다.
 */
export function createQuizSession(
  includeId: string | null = null,
  mode: QuizMode = "photo-to-name",
  scope: QuizScope = "all",
  habitat: string | null = null
): QuizSession {
  const focus =
    scope === "all" && includeId ? getById(includeId) : undefined;
  // "전체"는 pool 미주입 → createSession 기본(getAll) 동작·rng 소비를 그대로 보존.
  const pool =
    scope === "all" ? undefined : speciesInScope({ scope, habitat });

  return createSession(
    { mode, scope, size: SESSION_SIZE },
    {
      ...(pool ? { pool } : {}),
      ...(focus ? { mustInclude: [focus] } : {}),
    }
  );
}

/** 브라우저 URL의 `?include=` 값을 읽는다 (SSR 안전). */
export function includeFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("include");
}

/** 브라우저 URL의 `?mode=` 값을 읽는다. 미지정·미지원 값은 photo-to-name으로 폴백. */
export function modeFromLocation(): QuizMode {
  if (typeof window === "undefined") return "photo-to-name";
  const raw = new URLSearchParams(window.location.search).get("mode");
  return ENTERABLE_MODES.includes(raw as QuizMode)
    ? (raw as QuizMode)
    : "photo-to-name";
}

/** 브라우저 URL의 `?scope=` 값을 읽는다. 미지정·미지원 값은 all로 폴백. */
export function scopeFromLocation(): QuizScope {
  if (typeof window === "undefined") return "all";
  const raw = new URLSearchParams(window.location.search).get("scope");
  return SCOPES.includes(raw as QuizScope) ? (raw as QuizScope) : "all";
}

/** 브라우저 URL의 `?habitat=` 값을 읽는다 (서식지 범위용). */
export function habitatFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("habitat");
}

/** 홈 "집중 학습" 선택지에 표시할 범위별 가용 종 수. */
export interface ScopeAvailability {
  weak: number;
  review: number;
  habitats: { habitat: string; count: number }[];
}

/**
 * 취약종·복습·서식지별 가용 종 수를 한 번에 계산한다(홈 QuizScopePicker 주입용).
 * 진도 JSON이 손상돼도 홈은 죽지 않도록 취약/복습은 0으로 관대 폴백한다
 * (서식지 카운트는 정적 카탈로그라 항상 유효). 상세 복구는 /quiz·/progress가 담당.
 */
export function loadScopeAvailability(deps: ScopeDeps = {}): ScopeAvailability {
  const habitats = getHabitats();
  try {
    return {
      weak: speciesInScope({ scope: "weak" }, deps).length,
      review: speciesInScope({ scope: "review" }, deps).length,
      habitats,
    };
  } catch (err) {
    if (err instanceof ProgressCorruptedError) {
      return { weak: 0, review: 0, habitats };
    }
    throw err;
  }
}
