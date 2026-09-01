"use client";

import { useEffect, useState } from "react";
import type { QuizSession } from "@/types";
import {
  getAllProgress,
  resetAll,
  ProgressCorruptedError,
} from "@/services/progress.service";
import Link from "next/link";
import {
  createQuizSession,
  includeFromLocation,
  modeFromLocation,
  scopeFromLocation,
  habitatFromLocation,
} from "@/lib/quiz-session";
import QuizCard from "@/components/QuizCard";
import PhotoGridQuizCard from "@/components/PhotoGridQuizCard";
import ProgressResetModal from "@/components/ProgressResetModal";
import TopNav from "@/components/TopNav";

/** 현재 URL(범위·모드·include)에 맞는 세션을 만든다. */
function sessionFromLocation(): QuizSession {
  return createQuizSession(
    includeFromLocation(),
    modeFromLocation(),
    scopeFromLocation(),
    habitatFromLocation()
  );
}

/**
 * 퀴즈 페이지. `?mode=`로 사진→이름 / 이름→사진을 고르고, 세션을 마운트
 * 이후(클라이언트)에 생성해 정적 export 프리렌더와 hydration 불일치를 피한다.
 * 진도 JSON이 손상되면 초기화 안내 모달을 먼저 보여 준다 (NFR-003).
 */
export default function QuizPage() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [corrupted, setCorrupted] = useState(false);

  useEffect(() => {
    try {
      getAllProgress();
    } catch (err) {
      if (err instanceof ProgressCorruptedError) {
        setCorrupted(true);
        return;
      }
      throw err;
    }
    setSession(sessionFromLocation());
  }, []);

  const handleReset = () => {
    resetAll();
    setCorrupted(false);
    setSession(sessionFromLocation());
  };

  // 좁힌 범위(취약종·복습·서식지)에 종이 없어 문제가 하나도 없으면 빈 세션 대신 안내.
  const isEmptyScope =
    session !== null &&
    session.options.scope !== "all" &&
    session.questions.length === 0;

  return (
    <main className="min-h-screen py-6">
      <TopNav containerClass="max-w-md lg:max-w-4xl" />
      {corrupted && <ProgressResetModal onReset={handleReset} />}
      {!corrupted &&
        (isEmptyScope ? (
          <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-8 text-center">
            <p className="text-gray-600">이 범위에는 아직 학습할 새가 없어요.</p>
            <Link
              href="/"
              className="text-sm font-medium text-green-700 underline underline-offset-2"
            >
              홈으로 돌아가기
            </Link>
          </div>
        ) : session ? (
          session.options.mode === "name-to-photo" ? (
            <PhotoGridQuizCard session={session} />
          ) : (
            <QuizCard session={session} />
          )
        ) : (
          <p className="p-8 text-center text-gray-500">퀴즈 준비 중…</p>
        ))}
    </main>
  );
}
