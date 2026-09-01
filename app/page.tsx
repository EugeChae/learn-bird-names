"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Species, SpeciesTrivia } from "@/types";
import { getRandom } from "@/services/species.service";
import {
  countCorrectSpecies,
  TAXONOMY_UNLOCK_THRESHOLD,
  ProgressCorruptedError,
} from "@/services/progress.service";
import {
  loadScopeAvailability,
  type ScopeAvailability,
} from "@/lib/quiz-session";
import BirdCard from "@/components/BirdCard";
import TriviaCard, { pickTrivia } from "@/components/TriviaCard";
import QuizModePicker from "@/components/QuizModePicker";
import QuizScopePicker from "@/components/QuizScopePicker";

/**
 * 오늘의 새 홈 (STORY-005). 방문마다 getRandom()으로 종을 새로 고른다.
 * 정적 export hydration 불일치를 피하려고 클라이언트에서만 고른다.
 * 집중 학습(STORY-016) 범위별 가용 종 수도 클라이언트에서 계산한다(진도=localStorage).
 */
export default function Home() {
  const [species, setSpecies] = useState<Species | undefined>();
  const [trivia, setTrivia] = useState<SpeciesTrivia | undefined>();
  const [scopes, setScopes] = useState<ScopeAvailability | null>(null);
  const [taxo, setTaxo] = useState<
    { unlocked: boolean; correct: number } | undefined
  >();

  useEffect(() => {
    const bird = getRandom();
    setSpecies(bird);
    setTrivia(bird ? pickTrivia(bird.trivia) : undefined);
    setScopes(loadScopeAvailability());
    // 분류 모드 잠금 상태(누적 정답 종 수). 진도 손상 시 잠금으로 폴백.
    try {
      const correct = countCorrectSpecies();
      setTaxo({ unlocked: correct >= TAXONOMY_UNLOCK_THRESHOLD, correct });
    } catch (err) {
      if (err instanceof ProgressCorruptedError) {
        setTaxo({ unlocked: false, correct: 0 });
      } else throw err;
    }
  }, []);

  return (
    <main className="min-h-screen py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 lg:max-w-4xl">
        <header className="text-center">
          <p className="text-sm text-gray-500">한국 새 이름 배우기</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">오늘의 새</h1>
        </header>

        {!species ? (
          <p className="p-8 text-center text-gray-500">오늘의 새를 고르는 중…</p>
        ) : (
          /* 데스크톱(lg+): 새 카드 왼쪽 · 트리비아/퀴즈 시작 오른쪽. 모바일 세로 1열. */
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
            <BirdCard species={species} />
            <div className="flex flex-col gap-5">
              {trivia && <TriviaCard trivia={trivia} />}
              <QuizModePicker includeId={species.id} taxonomy={taxo} />
              {scopes && <QuizScopePicker availability={scopes} />}
              <Link
                href="/progress"
                className="text-center text-sm font-medium text-gray-500 underline underline-offset-2"
              >
                학습 진도 보기
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

