"use client";

import { useState } from "react";
import {
  type ProgressSummary,
  MASTERY_THRESHOLD,
} from "@/services/progress.service";
import ResetConfirmModal from "@/components/ResetConfirmModal";

interface ProgressBoardProps {
  summary: ProgressSummary;
  /** 확인 다이얼로그에서 초기화를 확정했을 때. */
  onReset: () => void;
}

/**
 * 진도 대시보드 (STORY-015 / FR-017).
 * 데이터 로드·손상 처리는 app/progress/page가 하고, 여기서는 받은 요약을
 * 시각화만 한다(테스트 용이). 학습/마스터 카운트 + 취약종 목록 + 초기화.
 */
export default function ProgressBoard({ summary, onReset }: ProgressBoardProps) {
  const [confirming, setConfirming] = useState(false);
  const { learned, total, mastered, weak } = summary;
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-5 p-4"
      aria-label="학습 진도 대시보드"
    >
      <header>
        <h1 className="text-2xl font-bold text-gray-900">학습 진도</h1>
      </header>

      {/* 학습 종 수 / 전체 종 수 (AC1) */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-600">학습한 새</span>
          <span className="text-lg font-semibold text-gray-900">
            <strong className="text-2xl text-green-700">{learned}</strong> /{" "}
            {total}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={learned}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="학습 진행률"
          />
        </div>
      </div>

      {/* 마스터 종 수 (AC2) */}
      <div className="flex items-baseline justify-between rounded-xl border border-gray-200 p-4">
        <span className="text-sm text-gray-600">
          마스터한 새{" "}
          <span className="text-xs text-gray-400">
            (연속 {MASTERY_THRESHOLD}회 이상 정답)
          </span>
        </span>
        <strong className="text-2xl text-amber-600">{mastered}</strong>
      </div>

      {/* 취약종 목록 (AC3) */}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">취약한 새</h2>
        {weak.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            아직 취약한 새가 없어요. 퀴즈를 풀면 자주 틀리는 새가 여기에 모여요.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {weak.map((w) => (
              <li
                key={w.species.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2"
              >
                <span className="font-medium text-gray-900">
                  {w.species.name_korean}
                </span>
                <span className="text-sm text-red-600">
                  오답률 {Math.round(w.missRate * 100)}%
                  <span className="ml-1 text-xs text-gray-400">
                    ({w.incorrect}/{w.attempts})
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* 진도 초기화 (AC4) */}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-2 rounded-lg border border-red-300 px-4 py-3 text-base font-medium text-red-700 hover:bg-red-50"
      >
        진도 초기화
      </button>

      {confirming && (
        <ResetConfirmModal
          onConfirm={() => {
            onReset();
            setConfirming(false);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  );
}
