"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
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
      <Button size="lg" fullWidth onClick={() => setOpen(true)}>
        퀴즈 시작
      </Button>
    );
  }

  return (
    <div role="group" aria-label="퀴즈 모드 선택" className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">어떤 퀴즈를 할까요?</p>
      <Button href={photoToNameHref} fullWidth>
        사진 보고 이름 맞히기
      </Button>
      <Button href={nameToPhotoHref} fullWidth>
        이름 보고 사진 맞히기
      </Button>

      {taxonomy?.unlocked ? (
        <Button href="/quiz?mode=taxonomy" fullWidth>
          분류 맞히기 🎉
        </Button>
      ) : (
        <Button variant="soft" fullWidth disabled>
          {taxonomy
            ? `분류 맞히기 (정답 ${taxonomy.correct}/${TAXONOMY_UNLOCK_THRESHOLD} 잠금)`
            : "분류 맞히기 (준비 중)"}
        </Button>
      )}

      {taxonomy?.unlocked && (
        <p className="text-center text-xs font-medium text-green-700">
          🎉 분류 모드 잠금 해제! 목·과 관계를 퀴즈로 배워 보세요.
        </p>
      )}
    </div>
  );
}
