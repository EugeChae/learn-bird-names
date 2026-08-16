"use client";

import { useEffect, useState } from "react";
import type { QuizSession } from "@/types";
import { createSession } from "@/services/quiz.service";
import QuizCard from "@/components/QuizCard";

/**
 * 사진→이름 퀴즈 페이지. 세션을 마운트 이후(클라이언트)에 생성해
 * 정적 export 프리렌더와 hydration 불일치를 피한다.
 */
export default function QuizPage() {
  const [session, setSession] = useState<QuizSession | null>(null);

  useEffect(() => {
    setSession(createSession({ mode: "photo-to-name", scope: "all", size: 10 }));
  }, []);

  return (
    <main className="min-h-screen py-6">
      {session ? (
        <QuizCard session={session} />
      ) : (
        <p className="p-8 text-center text-gray-500">퀴즈 준비 중…</p>
      )}
    </main>
  );
}
