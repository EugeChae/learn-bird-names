import type { QuizSession } from "@/types";
import { createSession } from "@/services/quiz.service";
import { getById } from "@/services/species.service";

/** `?include=` 종을 오늘의 새로 세션에 반드시 넣는다(종 수가 size를 넘어도 보장). */
export function createQuizSession(includeId: string | null = null): QuizSession {
  const focus = includeId ? getById(includeId) : undefined;
  return createSession(
    { mode: "photo-to-name", scope: "all", size: 10 },
    focus ? { mustInclude: [focus] } : {}
  );
}

/** 브라우저 URL의 `?include=` 값을 읽는다 (SSR 안전). */
export function includeFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("include");
}
