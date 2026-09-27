"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuizSession, QuizQuestion, AnswerResult } from "@/types";
import { nextQuestion, submitAnswer } from "@/services/quiz.service";
import { updateProgress } from "@/services/progress.service";
import { preloadGroups, photoGroupsFrom } from "@/lib/photo-preload";

export type QuizStatus = "answering" | "correct" | "revealed";

export interface QuizProgress {
  question: QuizQuestion | undefined;
  status: QuizStatus;
  /** 이번 문제에서 이미 틀린 보기 id (빨강 표시·재클릭 방지). */
  wrongIds: string[];
  hintText: string | null;
  /** 5·10 연속 달성 시 그 값, 아니면 null. */
  milestone: number | null;
  done: boolean;
  /** 1-based 현재 문제 번호. */
  position: number;
  /** 정답/공개로 문제가 마감됐는지 (answering이 아님). */
  resolved: boolean;
  select: (choiceId: string) => void;
  next: () => void;
  hint: () => void;
}

/**
 * 퀴즈 진행 상태 머신 (STORY-010에서 추출, STORY-011 공용).
 * 사진→이름·이름→사진은 프레젠테이션만 다르고 진행 규칙은 동일하다:
 * 재시도(첫 오답)→공개(두 번째 오답), 힌트 1회, 스트릭·마일스톤, 키보드 1~N 선택.
 * QuizSession(가변 컨테이너)을 quiz.service로 진행하고 확정된 답만 SRS에 반영한다.
 */
export function useQuizProgress(session: QuizSession): QuizProgress {
  const [question, setQuestion] = useState<QuizQuestion | undefined>(() =>
    nextQuestion(session)
  );
  const [status, setStatus] = useState<QuizStatus>("answering");
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [hintText, setHintText] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [done, setDone] = useState<boolean>(() => !nextQuestion(session));

  // 앞으로 나올 문제 2개의 사진을 순서대로 미리 받아 둔다 → "다음"을 누르면 즉시 뜬다.
  // 사진→이름은 문제 사진 1장, 이름→사진은 보기 사진 4장이 한 묶음.
  // 지금 화면 사진이 다 온 뒤에야 다음 묶음을 요청한다(동시에 보내면 지금 사진이 느려진다).
  useEffect(() => {
    const photoChoices = session.options.mode === "name-to-photo";
    return preloadGroups(
      photoGroupsFrom(session.questions, question, (q) =>
        photoChoices ? q.choices.map((c) => c.media[0]?.url) : [q.species.media[0]?.url]
      )
    );
  }, [session, question]);

  const select = useCallback(
    (choiceId: string) => {
      if (!question || status !== "answering" || wrongIds.includes(choiceId)) {
        return;
      }
      const result: AnswerResult = submitAnswer(
        session,
        choiceId,
        hintText !== null
      );
      // 재시도 중(quality 미확정)에는 SRS에 쓰지 않는다.
      if (!result.isRetry) {
        updateProgress(result.correctSpecies.id, result.quality);
      }
      if (result.correct) {
        setStatus("correct");
        if (session.streak === 5 || session.streak === 10) {
          setMilestone(session.streak);
        }
      } else if (result.isRetry) {
        setWrongIds((prev) => [...prev, choiceId]); // 첫 오답: 빨강 후 재시도
      } else {
        setWrongIds((prev) => [...prev, choiceId]); // 두 번째 오답: 정답 공개
        setStatus("revealed");
      }
    },
    [question, status, wrongIds, hintText, session]
  );

  const next = useCallback(() => {
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

  const hint = useCallback(() => {
    if (!question || hintText !== null) return;
    const s = question.species;
    setHintText(
      s.habitat.length > 0 ? `서식지: ${s.habitat[0]}` : `목(目): ${s.order}`
    );
  }, [question, hintText]);

  // 키보드 1~N으로 보기 선택 (그리드/리스트 렌더 순서 = choices 순서)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (status !== "answering" || !question) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= question.choices.length) {
        select(question.choices[n - 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, question, select]);

  const position = question
    ? session.questions.indexOf(question) + 1
    : session.questions.length;
  const resolved = status !== "answering";

  return {
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
  };
}
