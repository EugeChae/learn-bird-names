"use client";

import { useCallback, useEffect, useState } from "react";
import type { TaxonomySession, TaxonomyQuestion } from "@/types";
import {
  nextTaxonomyQuestion,
  submitTaxonomyAnswer,
} from "@/services/taxonomy.service";
import { orderKo, familyKo } from "@/lib/taxonomy-labels";

export type TaxonomyStatus = "answering" | "correct" | "revealed";

export interface TaxonomyProgress {
  question: TaxonomyQuestion | undefined;
  status: TaxonomyStatus;
  wrongIds: string[];
  hintText: string | null;
  milestone: number | null;
  done: boolean;
  position: number;
  resolved: boolean;
  select: (choiceId: string) => void;
  next: () => void;
  hint: () => void;
}

/** 문제 유형별 힌트 문구(정답을 직접 노출하지 않는 분류 힌트). */
function hintFor(q: TaxonomyQuestion): string {
  if (q.type === "photo-to-taxon" && q.promptSpecies) {
    if (q.taxonLevel === "family") {
      return `목(目): ${orderKo(q.promptSpecies.order)}`;
    }
    const habitat = q.promptSpecies.habitat[0];
    return habitat
      ? `서식지: ${habitat}`
      : "부리·다리·크기를 보고 무리를 추측해 보세요.";
  }
  if (q.type === "odd-one-out") {
    // 정답(이상한 종)이 아닌 3종이 공유하는 과를 알려 준다.
    const fams = q.choices
      .filter((c) => c.id !== q.correctId)
      .map((c) => c.species?.family)
      .filter(Boolean) as string[];
    const common = fams[0];
    return common
      ? `나머지 셋은 '${familyKo(common)}'예요.`
      : "과(科)가 다른 한 마리를 찾으세요.";
  }
  // family-membership: 제시된 과가 속한 목(目)을 알려 준다.
  const inFamily = q.choices.find(
    (c) => c.species && familyKo(c.species.family) === q.familyLabel
  );
  return inFamily
    ? `'${q.familyLabel}'은(는) '${orderKo(inFamily.species!.order)}' 무리예요.`
    : "과(科) 이름을 보고 소속을 판단하세요.";
}

/**
 * Taxonomy 퀴즈 진행 상태 머신 (STORY-014). useQuizProgress와 같은 규칙:
 * 재시도(첫 오답)→공개(두 번째), 힌트 1회, 스트릭·마일스톤, 키보드 1~N.
 * 다만 종 SRS는 갱신하지 않는다(분류 관계는 별개 스킬).
 */
export function useTaxonomyProgress(
  session: TaxonomySession
): TaxonomyProgress {
  const [question, setQuestion] = useState<TaxonomyQuestion | undefined>(() =>
    nextTaxonomyQuestion(session)
  );
  const [status, setStatus] = useState<TaxonomyStatus>("answering");
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [hintText, setHintText] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [done, setDone] = useState<boolean>(() => !nextTaxonomyQuestion(session));

  const select = useCallback(
    (choiceId: string) => {
      if (!question || status !== "answering" || wrongIds.includes(choiceId)) {
        return;
      }
      const result = submitTaxonomyAnswer(session, choiceId, hintText !== null);
      if (result.correct) {
        setStatus("correct");
        if (session.streak === 5 || session.streak === 10) {
          setMilestone(session.streak);
        }
      } else if (result.isRetry) {
        setWrongIds((prev) => [...prev, choiceId]);
      } else {
        setWrongIds((prev) => [...prev, choiceId]);
        setStatus("revealed");
      }
    },
    [question, status, wrongIds, hintText, session]
  );

  const next = useCallback(() => {
    const nq = nextTaxonomyQuestion(session);
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
    setHintText(hintFor(question));
  }, [question, hintText]);

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
