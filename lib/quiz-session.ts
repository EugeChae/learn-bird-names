import type { QuizSession } from "@/types";
import { createSession } from "@/services/quiz.service";
import { getAll, getById } from "@/services/species.service";

/** `?include=` 종을 풀에 넣어 오늘의 새가 세션에 반드시 들어가게 한다. */
export function createQuizSession(includeId: string | null = null): QuizSession {
  const focus = includeId ? getById(includeId) : undefined;
  const pool = focus
    ? [focus, ...getAll().filter((s) => s.id !== focus.id)]
    : undefined;
  return createSession(
    { mode: "photo-to-name", scope: "all", size: 10 },
    pool ? { pool } : {}
  );
}

/** 브라우저 URL의 `?include=` 값을 읽는다 (SSR 안전). */
export function includeFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("include");
}
