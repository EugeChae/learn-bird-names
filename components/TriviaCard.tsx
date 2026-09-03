"use client";

import { useState } from "react";
import type { SpeciesTrivia, TriviaType } from "@/types";
import Chip from "@/components/ui/Chip";

export const TRIVIA_TYPE_LABEL: Record<TriviaType, string> = {
  ecology: "생태",
  identification: "식별",
  seasonal: "계절",
};

/** 유형별 뱃지 톤(Chip). 생태=초록 · 식별=하늘 · 계절=꽃가루노랑. */
const TRIVIA_TONE: Record<TriviaType, "leaf" | "sky" | "pollen"> = {
  ecology: "leaf",
  identification: "sky",
  seasonal: "pollen",
};

/** 목록에서 트리비아 1개를 고른다. rng 주입 시 결정론적. */
export function pickTrivia(
  items: readonly SpeciesTrivia[],
  rng: () => number = Math.random
): SpeciesTrivia | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
}

interface TriviaCardProps {
  trivia: SpeciesTrivia;
}

/**
 * 오늘의 새 트리비아 (STORY-006).
 * 유형 뱃지 + 본문 + 출처(말줄임, 탭하면 전체).
 */
export default function TriviaCard({ trivia }: TriviaCardProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const label = TRIVIA_TYPE_LABEL[trivia.type];

  return (
    <article
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-soft"
      aria-label="오늘의 트리비아"
    >
      <Chip tone={TRIVIA_TONE[trivia.type]}>{label}</Chip>
      <p className="mt-2 text-lg leading-relaxed text-gray-800">
        {trivia.content}
      </p>
      <button
        type="button"
        aria-expanded={sourceOpen}
        onClick={() => setSourceOpen((open) => !open)}
        className="mt-3 block w-full text-left text-xs text-gray-500"
      >
        <span className={sourceOpen ? "" : "line-clamp-1"}>
          출처: {trivia.trivia_source}
        </span>
      </button>
    </article>
  );
}
