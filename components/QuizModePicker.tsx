"use client";

import { useState } from "react";
import Link from "next/link";

interface QuizModePickerProps {
  includeId: string;
}

/**
 * 홈의 퀴즈 진입 (STORY-005 / FR-006).
 * 시작 → 모드 선택. 사진→이름·이름→사진이 열려 있고, 분류 모드는 STORY-014 이후.
 */
export default function QuizModePicker({ includeId }: QuizModePickerProps) {
  const [open, setOpen] = useState(false);
  const include = encodeURIComponent(includeId);
  const photoToNameHref = `/quiz?include=${include}`;
  const nameToPhotoHref = `/quiz?mode=name-to-photo&include=${include}`;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700"
      >
        퀴즈 시작
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="퀴즈 모드 선택"
      className="flex flex-col gap-2"
    >
      <p className="text-sm font-medium text-gray-700">어떤 퀴즈를 할까요?</p>
      <Link
        href={photoToNameHref}
        className="rounded-lg bg-green-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-green-700"
      >
        사진 보고 이름 맞히기
      </Link>
      <Link
        href={nameToPhotoHref}
        className="rounded-lg bg-green-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-green-700"
      >
        이름 보고 사진 맞히기
      </Link>
      <button
        type="button"
        disabled
        className="rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-400"
      >
        분류 맞히기 (준비 중)
      </button>
    </div>
  );
}
