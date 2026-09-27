"use client";

import { useState } from "react";
import type { SpeciesTrivia, TriviaType } from "@/types";
import Chip from "@/components/ui/Chip";
import MomentGlyph from "@/components/MomentGlyph";
import { MOMENT_KO, type Moment } from "@/lib/moment";

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

/**
 * 순간별 카드 분위기(STORY-017 후속, Sally 제안).
 * 문장이 시간을 말할 때만 카드가 그 순간의 하늘이 된다 — 폴백은 흰 카드 그대로.
 * 문법은 하나: 팔레트 soft 톤 → 흰색 그라데이션 + 왼쪽 4px 띠 + 해 위치 글리프 + 같은 톤 칩.
 * 색만으로 구분하지 않는다(글리프 형태·칩 텍스트가 함께 간다).
 */
const MOMENT_STYLE: Record<
  Moment,
  { card: string; chip: "blush" | "sky" | "pollen"; glyph: string }
> = {
  dawn: {
    card: "border-blush-soft border-l-blush bg-gradient-to-b from-blush-soft/70 to-white",
    chip: "blush",
    glyph: "text-blush",
  },
  day: {
    card: "border-sky-soft border-l-sky bg-gradient-to-b from-sky-soft/80 to-white",
    chip: "sky",
    glyph: "text-sky",
  },
  dusk: {
    card: "border-pollen-soft border-l-pollen bg-gradient-to-b from-pollen-soft/80 via-blush-soft/40 to-white",
    chip: "pollen",
    glyph: "text-pollen",
  },
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
 * 오늘의 새 트리비아 (STORY-006 · STORY-017).
 * (순간 뱃지) + 유형 뱃지 + 본문 + 출처(말줄임, 탭하면 전체).
 * 순간 뱃지는 trivia.moment가 있을 때만 — 사용자 시계에 맞춰 고른 "새의 하루" 문장.
 */
export default function TriviaCard({ trivia }: TriviaCardProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const label = TRIVIA_TYPE_LABEL[trivia.type];
  const moment = trivia.moment ? MOMENT_STYLE[trivia.moment] : undefined;

  return (
    <article
      className={`rounded-2xl border p-4 shadow-soft ${
        moment ? `border-l-4 ${moment.card}` : "border-gray-200 bg-white"
      }`}
      aria-label="오늘의 트리비아"
      data-moment={trivia.moment}
    >
      <div className="flex flex-wrap items-center gap-1">
        {trivia.moment && (
          <>
            <MomentGlyph moment={trivia.moment} className={`mr-0.5 ${moment!.glyph}`} />
            <Chip tone={moment!.chip}>{MOMENT_KO[trivia.moment]}</Chip>
          </>
        )}
        <Chip tone={TRIVIA_TONE[trivia.type]}>{label}</Chip>
      </div>
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
