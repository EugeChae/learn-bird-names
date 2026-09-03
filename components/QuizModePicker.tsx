"use client";

import { useState } from "react";
import Link from "next/link";
import { TAXONOMY_UNLOCK_THRESHOLD } from "@/services/progress.service";

interface QuizModePickerProps {
  includeId: string;
  /** 분류 모드 잠금 상태(홈이 진도에서 계산해 주입). 없으면 잠금(준비 중)으로 본다. */
  taxonomy?: { unlocked: boolean; correct: number };
}

/**
 * 홈의 퀴즈 진입 (STORY-005 / FR-006).
 * 시작 → 모드 선택. 사진→이름·이름→사진은 열려 있고, 분류 모드는 누적 정답
 * 20종 달성 시 잠금 해제된다(STORY-014 / FR-015).
 */
export default function QuizModePicker({
  includeId,
  taxonomy,
}: QuizModePickerProps) {
  const [open, setOpen] = useState(false);
  const include = encodeURIComponent(includeId);
  const photoToNameHref = `/quiz?include=${include}`;
  const nameToPhotoHref = `/quiz?mode=name-to-photo&include=${include}`;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700"
      >
        퀴즈 시작
      </button>
    );
  }

  return (
    <div role="group" aria-label="퀴즈 모드 선택" className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">어떤 퀴즈를 할까요?</p>
      <Link
        href={photoToNameHref}
        className="rounded-full bg-green-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-green-700"
      >
        사진 보고 이름 맞히기
      </Link>
      <Link
        href={nameToPhotoHref}
        className="rounded-full bg-green-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-green-700"
      >
        이름 보고 사진 맞히기
      </Link>

      {taxonomy?.unlocked ? (
        <Link
          href="/quiz?mode=taxonomy"
          className="rounded-full bg-green-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-green-700"
        >
          분류 맞히기 🎉
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="rounded-full border border-gray-200 px-4 py-3 text-base text-gray-400"
        >
          {taxonomy
            ? `분류 맞히기 (정답 ${taxonomy.correct}/${TAXONOMY_UNLOCK_THRESHOLD} 잠금)`
            : "분류 맞히기 (준비 중)"}
        </button>
      )}

      {taxonomy?.unlocked && (
        <p className="text-center text-xs font-medium text-green-700">
          🎉 분류 모드 잠금 해제! 목·과 관계를 퀴즈로 배워 보세요.
        </p>
      )}
    </div>
  );
}
