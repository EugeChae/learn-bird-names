import type { QuizSession, QuizMode } from "@/types";
import { createSession } from "@/services/quiz.service";
import { getById } from "@/services/species.service";

/** UI에서 진입 가능한 퀴즈 모드(taxonomy는 STORY-014). */
const ENTERABLE_MODES: readonly QuizMode[] = ["photo-to-name", "name-to-photo"];

/** `?include=` 종을 오늘의 새로 세션에 반드시 넣는다(종 수가 size를 넘어도 보장). */
export function createQuizSession(
  includeId: string | null = null,
  mode: QuizMode = "photo-to-name"
): QuizSession {
  const focus = includeId ? getById(includeId) : undefined;
  return createSession(
    { mode, scope: "all", size: 10 },
    focus ? { mustInclude: [focus] } : {}
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
