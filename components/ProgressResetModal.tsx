"use client";

interface ProgressResetModalProps {
  onReset: () => void;
}

/**
 * 진도 JSON 파싱 실패 시 안내 (STORY-008 / NFR-003).
 * 복원이 불가능하므로 초기화만이 다음 단계다.
 */
export default function ProgressResetModal({ onReset }: ProgressResetModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-reset-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <h2 id="progress-reset-title" className="text-lg font-bold text-gray-900">
          학습 진도를 불러올 수 없어요
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          저장된 진도 데이터가 손상되었습니다. 초기화하면 퀴즈를 다시 시작할 수
          있어요. 이전 학습 기록은 복원할 수 없습니다.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-green-700"
        >
          진도 초기화
        </button>
      </div>
    </div>
  );
}
