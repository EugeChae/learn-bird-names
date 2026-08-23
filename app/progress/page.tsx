"use client";

import { useEffect, useState } from "react";
import {
  getProgressSummary,
  resetAll,
  ProgressCorruptedError,
  type ProgressSummary,
} from "@/services/progress.service";
import ProgressBoard from "@/components/ProgressBoard";
import ProgressResetModal from "@/components/ProgressResetModal";

/**
 * 진도 대시보드 페이지 (STORY-015).
 * 요약을 마운트 이후(클라이언트)에 계산해 정적 export 프리렌더와 hydration
 * 불일치를 피한다. 진도 JSON이 손상되면 초기화 안내 모달을 먼저 보여 준다 (AC5).
 */
export default function ProgressPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [corrupted, setCorrupted] = useState(false);

  const load = () => {
    try {
      setSummary(getProgressSummary());
    } catch (err) {
      if (err instanceof ProgressCorruptedError) {
        setCorrupted(true);
        return;
      }
      throw err;
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReset = () => {
    resetAll();
    setCorrupted(false);
    setSummary(getProgressSummary());
  };

  return (
    <main className="min-h-screen py-6">
      {corrupted && <ProgressResetModal onReset={handleReset} />}
      {!corrupted && summary ? (
        <ProgressBoard summary={summary} onReset={handleReset} />
      ) : (
        !corrupted && (
          <p className="p-8 text-center text-gray-500">진도를 불러오는 중…</p>
        )
      )}
    </main>
  );
}
