"use client";

import { useEffect } from "react";

interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 진도 초기화 확인 다이얼로그 (STORY-015 AC4).
 * 손상 안내(ProgressResetModal)와 달리, 사용자가 의도적으로 지울 때 되돌릴 수
 * 없음을 경고하고 취소 기회를 준다. Escape·오버레이 클릭으로 취소된다.
 */
export default function ResetConfirmModal({
  onConfirm,
  onCancel,
}: ResetConfirmModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg"
      >
        <h2
          id="reset-confirm-title"
          className="text-lg font-bold text-gray-900"
        >
          학습 진도를 초기화할까요?
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          지금까지의 학습 기록(정답·복습 일정·취약종)이 모두 지워지고 되돌릴 수
          없어요.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-base font-semibold text-white hover:bg-red-700"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
