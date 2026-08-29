"use client";

import { useState } from "react";
import type { QuizSession } from "@/types";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import PhotoModal from "@/components/PhotoModal";
import SessionComplete from "@/components/SessionComplete";
import MilestoneBanner from "@/components/MilestoneBanner";
import FlagPhotoButton from "@/components/FlagPhotoButton";

interface QuizCardProps {
  session: QuizSession;
}

/**
 * 사진→이름 퀴즈 카드 (STORY-010).
 * 진행 규칙은 useQuizProgress 공용 훅에 있고, 이 컴포넌트는 "사진 1장 보고
 * 이름 4지선다" 프레젠테이션만 담당한다. 세션이 끝나면 짝짓기 복습으로 전환.
 */
export default function QuizCard({ session }: QuizCardProps) {
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
  const [photoOpen, setPhotoOpen] = useState(false);

  if (done || !question) {
    return <SessionComplete session={session} />;
  }

  const photo = question.species.media[0];

  const choiceClass = (choiceId: string) => {
    const base =
      "w-full rounded-lg border px-4 py-3 text-left text-base font-medium transition disabled:cursor-not-allowed";
    if (resolved && choiceId === question.correctId) {
      return `${base} border-green-500 bg-green-50 text-green-800`;
    }
    if (wrongIds.includes(choiceId)) {
      return `${base} border-red-400 bg-red-50 text-red-700`;
    }
    return `${base} border-gray-300 bg-white text-gray-900 hover:border-gray-500`;
  };

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-4 p-4"
      aria-label="사진 이름 맞히기 퀴즈"
    >
      <header className="flex items-center justify-between text-sm text-gray-600">
        <span>
          문제 {position} / {session.questions.length}
        </span>
        <span aria-label={`연속 정답 ${session.streak}`}>
          🔥 연속 <strong className="text-gray-900">{session.streak}</strong>
        </span>
      </header>

      {photo ? (
        <figure className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            aria-label="새 사진 확대"
            className="overflow-hidden rounded-xl border border-gray-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- unoptimized static export; next/image adds no value here */}
            <img
              src={photo.url}
              alt="맞혀야 할 새 사진"
              className="aspect-square w-full object-cover"
            />
          </button>
          <div className="flex items-center justify-between gap-2">
            <FlagPhotoButton
              speciesId={question.species.id}
              nameKorean={question.species.name_korean}
              photoUrl={photo.url}
            />
            <figcaption className="text-right text-[10px] text-gray-400">
              {photo.attribution}
            </figcaption>
          </div>
        </figure>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
          사진 없음
        </div>
      )}

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

      <ul className="flex flex-col gap-2">
        {question.choices.map((choice, i) => (
          <li key={choice.id}>
            <button
              type="button"
              onClick={() => select(choice.id)}
              disabled={resolved || wrongIds.includes(choice.id)}
              className={choiceClass(choice.id)}
            >
              <span className="mr-2 text-gray-400">{i + 1}</span>
              {choice.name_korean}
            </button>
          </li>
        ))}
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
            정답은 <strong>{question.species.name_korean}</strong> 이에요.
          </p>
        )}
        {milestone !== null && <MilestoneBanner streak={milestone} />}
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

      <div className="text-center">
        <a
          href="/flags"
          className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
        >
          🚩 사진 변경요청 목록
        </a>
      </div>

      {photoOpen && photo && (
        <PhotoModal
          src={photo.url}
          alt={question.species.name_korean}
          attribution={photo.attribution}
          onClose={() => setPhotoOpen(false)}
        />
      )}
    </section>
  );
}
