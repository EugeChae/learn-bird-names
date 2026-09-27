"use client";

import { useState } from "react";
import {
  type ProgressSummary,
  MASTERY_THRESHOLD,
  LEVEL_UP_RATIO,
} from "@/services/progress.service";
import ResetConfirmModal from "@/components/ResetConfirmModal";
import LeafDecor from "@/components/LeafDecor";
import Button from "@/components/ui/Button";
import BirdMascot from "@/components/BirdMascot";
import type { MomentViews } from "@/lib/birdOfTheDay.store";
import { MOMENT_KO, MOMENTS } from "@/lib/moment";

interface ProgressBoardProps {
  summary: ProgressSummary;
  /** 확인 다이얼로그에서 초기화를 확정했을 때. */
  onReset: () => void;
  /** 오늘 만날 새를 어느 순간에 열어봤는지(로컬 계측, STORY-017). 없으면 표시 안 함. */
  momentViews?: MomentViews;
}

/** 레벨별 오답 보기 설명(어디서 보기를 뽑는지). */
const LEVEL_LABEL: Record<1 | 2 | 3, string> = {
  1: "먼 새끼리",
  2: "비슷한 무리끼리",
  3: "헷갈리는 새끼리",
};

/**
 * 진도 대시보드 (STORY-015 / FR-017).
 * 데이터 로드·손상 처리는 app/progress/page가 하고, 여기서는 받은 요약을
 * 시각화만 한다(테스트 용이). 학습/마스터 카운트 + 취약종 목록 + 초기화.
 */
export default function ProgressBoard({
  summary,
  onReset,
  momentViews,
}: ProgressBoardProps) {
  const [confirming, setConfirming] = useState(false);
  const { learned, total, mastered, weak, level } = summary;
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
  const [tier1, tier2] = level.tiers;
  const ratioPct = Math.round(LEVEL_UP_RATIO * 100);

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 lg:max-w-4xl"
      aria-label="학습 진도 대시보드"
    >
      <header className="relative">
        <LeafDecor className="pointer-events-none absolute -top-4 right-0 h-12 w-12 rotate-[20deg] opacity-80" />
        <h1 className="text-3xl font-bold text-gray-900">학습 진도</h1>
      </header>

      {/* 데스크톱(lg+): 통계 왼쪽 · 취약종 목록 오른쪽 2단. 모바일 세로 1열. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
      <div className="flex flex-col gap-5">
      {/* 학습 종 수 / 전체 종 수 (AC1) */}
      <div className="rounded-2xl border border-gray-200 p-4 shadow-soft">
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

      {/* 오답 보기 레벨 — 승급 조건이 그대로 보여야 한다 */}
      <div
        className="rounded-2xl border border-gray-200 p-4 shadow-soft"
        aria-label="오답 보기 레벨"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-600">
            오답 보기 레벨{" "}
            <span className="text-xs text-gray-400">{LEVEL_LABEL[level.level]}</span>
          </span>
          <strong className="text-2xl text-green-700">Lv {level.level}</strong>
        </div>
        <ul className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
          <li>
            친숙한 새(1단계) 마스터 {tier1.mastered}/{tier1.total}
            <span className="ml-1 text-gray-400">(승급 기준 {tier1.required})</span>
          </li>
          <li>
            탐조 입문 새(2단계) 마스터 {tier2.mastered}/{tier2.total}
            <span className="ml-1 text-gray-400">(승급 기준 {tier2.required})</span>
          </li>
        </ul>
        <p className="mt-2 text-sm text-gray-700">
          {level.next
            ? `Lv ${level.next.level}까지 ${level.next.tier}단계 새 ${level.next.remaining}종 더 마스터하면 돼요.`
            : "최고 레벨이에요. 혼동하기 쉬운 새끼리 보기에 나와요."}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          각 단계 새의 {ratioPct}% 이상을 마스터하면 자동으로 올라가고, 내려가지 않아요.
        </p>
      </div>

      {/* 마스터 종 수 (AC2) */}
      <div className="flex items-baseline justify-between rounded-2xl border border-gray-200 p-4 shadow-soft">
        <span className="text-sm text-gray-600">
          마스터한 새{" "}
          <span className="text-xs text-gray-400">
            (연속 {MASTERY_THRESHOLD}회 이상 정답)
          </span>
        </span>
        <strong className="text-2xl text-pollen">{mastered}</strong>
      </div>
      </div>

      {/* 취약종 목록 (AC3) */}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">취약한 새</h2>
        {weak.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            <BirdMascot className="h-12 w-12 opacity-80" />
            <p>아직 취약한 새가 없어요. 퀴즈를 풀면 자주 틀리는 새가 여기에 모여요.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {weak.map((w) => (
              <li
                key={w.species.id}
                className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-2"
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
      </div>

      {momentViews && (
        <p className="text-center text-xs text-gray-400" aria-label="오늘 만날 새 열람">
          오늘 만날 새를 열어본 시간 ·{" "}
          {MOMENTS.map((m) => `${MOMENT_KO[m]} ${momentViews[m]}`).join(" · ")}
        </p>
      )}

      {/* 진도 초기화 (AC4) */}
      <Button
        variant="danger"
        fullWidth
        onClick={() => setConfirming(true)}
        className="mt-2"
      >
        진도 초기화
      </Button>

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
