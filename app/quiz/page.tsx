"use client";

import { useEffect, useState } from "react";
import type { QuizSession } from "@/types";
import { createSession } from "@/services/quiz.service";
import {
  getAllProgress,
  resetAll,
  ProgressCorruptedError,
} from "@/services/progress.service";
import QuizCard from "@/components/QuizCard";
import ProgressResetModal from "@/components/ProgressResetModal";

/**
 * 사진→이름 퀴즈 페이지. 세션을 마운트 이후(클라이언트)에 생성해
 * 정적 export 프리렌더와 hydration 불일치를 피한다.
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
    setSession(createSession({ mode: "photo-to-name", scope: "all", size: 10 }));
  }, []);

  const handleReset = () => {
    resetAll();
    setCorrupted(false);
    setSession(createSession({ mode: "photo-to-name", scope: "all", size: 10 }));
  };

  return (
    <main className="min-h-screen py-6">
      {corrupted && <ProgressResetModal onReset={handleReset} />}
      {!corrupted && session ? (
        <QuizCard session={session} />
      ) : (
        !corrupted && (
          <p className="p-8 text-center text-gray-500">퀴즈 준비 중…</p>
        )
      )}
    </main>
  );
}
