"use client";

import { useState } from "react";
import type { QuizSession } from "@/types";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import PhotoModal from "@/components/PhotoModal";
import SessionComplete from "@/components/SessionComplete";

interface PhotoGridQuizCardProps {
  session: QuizSession;
}

/**
 * 이름→사진 퀴즈 카드 (STORY-011 / FR-013).
 * 진행 규칙은 QuizCard와 동일하게 useQuizProgress 훅을 공유하고, 여기서는
 * "한국 공식명 보고 2×2 사진 그리드에서 맞는 사진 고르기" 프레젠테이션만 담당한다.
 * 보기 사진은 정답 종 + 오답 보기 종의 사진 각 1장(quiz.service의 choices).
 * 각 타일은 답 선택이므로, 확대는 별도 🔍 버튼으로 제공한다(정답 노출 방지 위해
 * 확대 모달에도 종명은 보여 주지 않는다).
 */
export default function PhotoGridQuizCard({
  session,
}: PhotoGridQuizCardProps) {
  const {
    question,
    status,
    wrongIds,
    hintText,
    milestone,
    done,
    position,
    resolved,
    select,
    next,
    hint,
  } = useQuizProgress(session);
  const [zoomId, setZoomId] = useState<string | null>(null);

  if (done || !question) {
    return <SessionComplete session={session} />;
  }

  const zoomChoice = question.choices.find((c) => c.id === zoomId);
  const zoomPhoto = zoomChoice?.media[0];

  const tileClass = (choiceId: string) => {
    const base =
      "relative block w-full overflow-hidden rounded-xl border-4 transition disabled:cursor-not-allowed";
    if (resolved && choiceId === question.correctId) {
      return `${base} border-green-500`;
    }
    if (wrongIds.includes(choiceId)) {
      return `${base} border-red-400`;
    }
    return `${base} border-transparent hover:border-gray-400`;
  };

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-4 p-4"
      aria-label="이름 보고 사진 맞히기 퀴즈"
    >
      <header className="flex items-center justify-between text-sm text-gray-600">
        <span>
          문제 {position} / {session.questions.length}
        </span>
        <span aria-label={`연속 정답 ${session.streak}`}>
          🔥 연속 <strong className="text-gray-900">{session.streak}</strong>
        </span>
      </header>

      <div className="rounded-xl bg-gray-50 px-4 py-6 text-center">
        <p className="text-sm text-gray-500">이 새의 사진을 고르세요</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {question.species.name_korean}
        </p>
      </div>

      <div className="min-h-[2rem]">
        {hintText ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            💡 {hintText}
          </p>
        ) : (
          !resolved && (
            <button
              type="button"
              onClick={hint}
              className="text-sm font-medium text-amber-700 underline underline-offset-2"
            >
              힌트 보기 (1회)
            </button>
          )
        )}
      </div>

      <ul className="grid grid-cols-2 gap-2">
        {question.choices.map((choice, i) => {
          const photo = choice.media[0];
          return (
            <li key={choice.id} className="relative">
              <button
                type="button"
                onClick={() => select(choice.id)}
                disabled={resolved || wrongIds.includes(choice.id)}
                aria-label={`${i + 1}번 사진 선택`}
                className={tileClass(choice.id)}
              >
                {photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- unoptimized static export; next/image adds no value here */
                  <img
                    src={photo.url}
                    alt={`새 사진 ${i + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
                    사진 없음
                  </div>
                )}
                <span className="absolute left-1 top-1 rounded bg-black/50 px-1.5 text-sm font-medium text-white">
                  {i + 1}
                </span>
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={() => setZoomId(choice.id)}
                  aria-label={`${i + 1}번 사진 확대`}
                  className="absolute right-1 top-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
                >
                  🔍
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="min-h-[3rem]">
        {status === "correct" && (
          <p className="font-semibold text-green-700">정답입니다! 🎉</p>
        )}
        {status === "answering" && wrongIds.length > 0 && (
          <p className="font-medium text-red-600">틀렸어요. 다시 시도해 보세요.</p>
        )}
        {status === "revealed" && (
          <p className="font-medium text-gray-800">
            정답 사진을 초록색으로 표시했어요.
          </p>
        )}
        {milestone !== null && (
          <p className="mt-1 font-bold text-orange-600">
            {milestone}연속 정답 달성! 대단해요 🔥
          </p>
        )}
      </div>

      {resolved && (
        <button
          type="button"
          onClick={next}
          className="rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-green-700"
        >
          다음
        </button>
      )}

      {zoomPhoto && (
        <PhotoModal
          src={zoomPhoto.url}
          alt="새 사진 확대"
          attribution={zoomPhoto.attribution}
          onClose={() => setZoomId(null)}
        />
      )}
    </section>
  );
}
