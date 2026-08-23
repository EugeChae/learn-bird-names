"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Species, SpeciesTrivia } from "@/types";
import { getRandom } from "@/services/species.service";
import BirdCard from "@/components/BirdCard";
import TriviaCard, { pickTrivia } from "@/components/TriviaCard";
import QuizModePicker from "@/components/QuizModePicker";

/**
 * 오늘의 새 홈 (STORY-005). 방문마다 getRandom()으로 종을 새로 고른다.
 * 정적 export hydration 불일치를 피하려고 클라이언트에서만 고른다.
 */
export default function Home() {
  const [species, setSpecies] = useState<Species | undefined>();
  const [trivia, setTrivia] = useState<SpeciesTrivia | undefined>();

  useEffect(() => {
    const bird = getRandom();
    setSpecies(bird);
    setTrivia(bird ? pickTrivia(bird.trivia) : undefined);
  }, []);

  return (
    <main className="min-h-screen py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-4">
        <header className="text-center">
          <p className="text-sm text-gray-500">한국 새 이름 배우기</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">오늘의 새</h1>
        </header>

        {!species ? (
          <p className="p-8 text-center text-gray-500">오늘의 새를 고르는 중…</p>
        ) : (
          <>
            <BirdCard species={species} />
            {trivia && <TriviaCard trivia={trivia} />}
            <QuizModePicker includeId={species.id} />
            <Link
              href="/progress"
              className="text-center text-sm font-medium text-gray-500 underline underline-offset-2"
            >
              학습 진도 보기
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

