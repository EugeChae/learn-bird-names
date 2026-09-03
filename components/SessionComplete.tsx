"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { QuizSession } from "@/types";
import { getMatchingRound, getSessionSummary } from "@/services/quiz.service";
import MatchingGame from "@/components/MatchingGame";
import Button from "@/components/ui/Button";

/**
 * 세션 종료 화면 (STORY-013 / FR-014). 두 퀴즈 모드가 공유한다.
 * 흐름: 짝짓기 복습(MatchingGame) → 모두 매치되면 결과 화면(정답/오답/최고 스트릭).
 * 짝지을 종이 없으면(전부 1번에 정답) 곧장 결과 화면으로 시작한다.
 */
export default function SessionComplete({ session }: { session: QuizSession }) {
  const pairs = useMemo(() => getMatchingRound(session), [session]);
  const needsMatching = pairs.some((p) => !p.wasEasy);
  const [phase, setPhase] = useState<"matching" | "results">(
    needsMatching ? "matching" : "results"
  );

  if (phase === "matching") {
    return <MatchingGame pairs={pairs} onComplete={() => setPhase("results")} />;
  }

  const { correct, incorrect, maxStreak } = getSessionSummary(session);

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 lg:max-w-4xl"
      aria-label="세션 결과"
    >
      <h2 className="text-2xl font-bold">퀴즈 완료!</h2>

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-gray-200 py-3 shadow-soft">
          <dt className="text-xs text-gray-500">정답</dt>
          <dd className="text-2xl font-bold text-green-700">{correct}</dd>
        </div>
        <div className="rounded-2xl border border-gray-200 py-3 shadow-soft">
          <dt className="text-xs text-gray-500">오답</dt>
          <dd className="text-2xl font-bold text-red-600">{incorrect}</dd>
        </div>
        <div className="rounded-2xl border border-gray-200 py-3 shadow-soft">
          <dt className="text-xs text-gray-500">최고 연속</dt>
          <dd className="text-2xl font-bold text-gray-900">🔥 {maxStreak}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <Button href="/quiz" fullWidth>
          새 퀴즈 시작
        </Button>
        <Link
          href="/"
          className="text-center text-sm font-medium text-gray-500 underline underline-offset-2"
        >
          홈으로
        </Link>
      </div>
    </section>
  );
}
