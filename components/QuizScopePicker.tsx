"use client";

import Link from "next/link";
import type { ScopeAvailability } from "@/lib/quiz-session";
import { MIN_SCOPE_SPECIES } from "@/lib/quiz-session";

interface QuizScopePickerProps {
  availability: ScopeAvailability;
}

/**
 * 홈 "집중 학습" 범위 선택 (STORY-016 / FR-018).
 * 취약종·오늘 복습·서식지별 범위를 고르면 해당 pool로 퀴즈를 시작한다(기본 사진→이름).
 * "전체" 범위는 위쪽 QuizModePicker(오늘의 새 포함)가 담당한다.
 *
 * 데이터는 prop 주입형(availability) — 로드는 홈 페이지가, 표시는 여기가 맡아 테스트가 쉽다.
 * 범위 내 종이 5개 미만이면 경고를, 0이면 진입을 막는다(빈 세션 방지).
 */
export default function QuizScopePicker({
  availability,
}: QuizScopePickerProps) {
  const { weak, review, habitats } = availability;

  return (
    <section aria-label="집중 학습" className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">집중 학습</p>

      <ScopeOption label="취약종만" href="/quiz?scope=weak" count={weak} />
      <ScopeOption
        label="오늘 복습 대상"
        href="/quiz?scope=review"
        count={review}
      />

      <div className="mt-1 flex flex-col gap-1">
        <p className="text-xs text-gray-500">서식지별</p>
        {habitats.map((h) => (
          <ScopeOption
            key={h.habitat}
            label={h.habitat}
            href={`/quiz?scope=habitat&habitat=${encodeURIComponent(
              h.habitat
            )}`}
            count={h.count}
          />
        ))}
      </div>
    </section>
  );
}

/** 범위 선택지 한 줄. count===0이면 비활성, 0<count<5면 경고 문구를 함께 보인다. */
function ScopeOption({
  label,
  href,
  count,
}: {
  label: string;
  href: string;
  count: number;
}) {
  const tooFew = count > 0 && count < MIN_SCOPE_SPECIES;

  if (count === 0) {
    return (
      <div
        aria-disabled="true"
        className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-400"
      >
        <span>{label}</span>
        <span className="text-xs">학습할 새가 없어요</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-base font-medium text-green-800 hover:bg-green-100"
    >
      <span>{label}</span>
      <span
        className={tooFew ? "text-xs text-amber-600" : "text-xs text-green-600"}
      >
        {tooFew ? `${count}종 · 5종 미만이라 문제가 적어요` : `${count}종`}
      </span>
    </Link>
  );
}
