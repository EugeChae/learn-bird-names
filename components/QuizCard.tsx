"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuizSession, QuizQuestion, AnswerResult } from "@/types";
import {
  nextQuestion,
  submitAnswer,
  getMatchingRound,
} from "@/services/quiz.service";
import PhotoModal from "@/components/PhotoModal";

type Status = "answering" | "correct" | "revealed";

interface QuizCardProps {
  session: QuizSession;
}

/**
 * 사진→이름 퀴즈 카드 (STORY-010).
 * QuizSession(가변 컨테이너)을 받아 quiz.service로 진행하며, 각 문제의 피드백을
 * 로컬 상태로 표현한다. 세션이 끝나면 짝짓기 복습 화면으로 전환한다.
 */
export default function QuizCard({ session }: QuizCardProps) {
  const [question, setQuestion] = useState<QuizQuestion | undefined>(() =>
    nextQuestion(session)
  );
  const [status, setStatus] = useState<Status>("answering");
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [hintText, setHintText] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [done, setDone] = useState<boolean>(() => !nextQuestion(session));

  const handleSelect = useCallback(
    (choiceId: string) => {
      if (!question || status !== "answering" || wrongIds.includes(choiceId)) {
        return;
      }
      const result: AnswerResult = submitAnswer(
        session,
        choiceId,
        hintText !== null
      );
      if (result.correct) {
        setStatus("correct");
        if (session.streak === 5 || session.streak === 10) {
          setMilestone(session.streak);
        }
      } else if (result.isRetry) {
        setWrongIds((prev) => [...prev, choiceId]); // 첫 오답: 빨강 표시 후 재시도
      } else {
        setWrongIds((prev) => [...prev, choiceId]); // 두 번째 오답: 정답 공개
        setStatus("revealed");
      }
    },
    [question, status, wrongIds, hintText, session]
  );

  const handleNext = useCallback(() => {
    const nq = nextQuestion(session);
    if (!nq) {
      setDone(true);
      return;
    }
    setQuestion(nq);
    setStatus("answering");
    setWrongIds([]);
    setHintText(null);
    setMilestone(null);
  }, [session]);

  const handleHint = () => {
    if (!question || hintText !== null) return;
    const s = question.species;
    setHintText(s.habitat.length > 0 ? `서식지: ${s.habitat[0]}` : `목(目): ${s.order}`);
  };

  // 키보드 1~4로 보기 선택
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (status !== "answering" || !question) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= question.choices.length) {
        handleSelect(question.choices[n - 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, question, handleSelect]);

  if (done || !question) {
    return <SessionComplete session={session} />;
  }

  const photo = question.species.media[0];
  const position = session.questions.indexOf(question) + 1;
  const resolved = status !== "answering";

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
          <figcaption className="text-right text-[10px] text-gray-400">
            {photo.attribution}
          </figcaption>
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
              onClick={handleHint}
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
              onClick={() => handleSelect(choice.id)}
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
        {milestone !== null && (
          <p className="mt-1 font-bold text-orange-600">
            {milestone}연속 정답 달성! 대단해요 🔥
          </p>
        )}
      </div>

      {resolved && (
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-green-700"
        >
          다음
        </button>
      )}

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

/** 세션 종료 → 짝짓기 복습 화면(전환). 인터랙티브 짝짓기 게임 자체는 STORY-013. */
function SessionComplete({ session }: { session: QuizSession }) {
  const pairs = getMatchingRound(session);
  const total = session.questions.length;
  const cleanCount = pairs.filter((p) => p.wasEasy).length;

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-4 p-4"
      aria-label="세션 완료 · 짝짓기 복습"
    >
      <h2 className="text-2xl font-bold">퀴즈 완료!</h2>
      <p className="text-gray-700">
        최고 연속 정답 <strong>{session.maxStreak}</strong> · 1번에 맞힌 새{" "}
        <strong>
          {cleanCount} / {total}
        </strong>
      </p>

      <h3 className="mt-2 text-lg font-semibold">짝짓기 복습</h3>
      <p className="text-sm text-gray-500">
        이번 세션에서 만난 새들이에요. 흐린 항목은 1번에 맞힌 새입니다. (짝짓기
        게임은 준비 중 — STORY-013)
      </p>
      <ul className="flex flex-col gap-2">
        {pairs.map((p) => (
          <li
            key={p.species.id}
            className={`rounded-md border border-gray-200 px-3 py-2 ${
              p.wasEasy ? "opacity-40" : ""
            }`}
          >
            {p.species.name_korean}
          </li>
        ))}
      </ul>
    </section>
  );
}
