"use client";

import { useEffect, useState } from "react";
import type { QuizSession, TaxonomySession } from "@/types";
import {
  getAllProgress,
  resetAll,
  countCorrectSpecies,
  TAXONOMY_UNLOCK_THRESHOLD,
  ProgressCorruptedError,
} from "@/services/progress.service";
import { createTaxonomySession } from "@/services/taxonomy.service";
import Link from "next/link";
import {
  createQuizSession,
  includeFromLocation,
  modeFromLocation,
  scopeFromLocation,
  habitatFromLocation,
} from "@/lib/quiz-session";
import QuizCard from "@/components/QuizCard";
import PhotoGridQuizCard from "@/components/PhotoGridQuizCard";
import TaxonomyCard from "@/components/TaxonomyCard";
import ProgressResetModal from "@/components/ProgressResetModal";
import TopNav from "@/components/TopNav";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import BirdMascot from "@/components/BirdMascot";

/** 현재 URL(범위·모드·include)에 맞는 세션을 만든다. */
function sessionFromLocation(): QuizSession {
  return createQuizSession(
    includeFromLocation(),
    modeFromLocation(),
    scopeFromLocation(),
    habitatFromLocation()
  );
}

/**
 * 퀴즈 페이지. `?mode=`로 사진→이름 / 이름→사진을 고르고, 세션을 마운트
 * 이후(클라이언트)에 생성해 정적 export 프리렌더와 hydration 불일치를 피한다.
 * 진도 JSON이 손상되면 초기화 안내 모달을 먼저 보여 준다 (NFR-003).
 */
export default function QuizPage() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [taxonomy, setTaxonomy] = useState<TaxonomySession | null>(null);
  const [taxoLocked, setTaxoLocked] = useState<{ correct: number } | null>(null);
  const [corrupted, setCorrupted] = useState(false);

  // 분류 모드는 누적 정답 20종 달성 시에만 연다(STORY-014 AC1). 홈 버튼뿐 아니라
  // URL 직접 진입(?mode=taxonomy)도 여기서 막는다. 진도는 호출 전 검증돼 안전.
  const startTaxonomyOrLock = () => {
    const correct = countCorrectSpecies();
    if (correct >= TAXONOMY_UNLOCK_THRESHOLD) {
      setTaxoLocked(null);
      setTaxonomy(createTaxonomySession());
    } else {
      setTaxonomy(null);
      setTaxoLocked({ correct });
    }
  };

  useEffect(() => {
    try {
      getAllProgress();
    } catch (err) {
      if (err instanceof ProgressCorruptedError) {
        setCorrupted(true);
        return;
      }
      throw err;
    }
    if (modeFromLocation() === "taxonomy") startTaxonomyOrLock();
    else setSession(sessionFromLocation());
  }, []);

  const handleReset = () => {
    resetAll();
    setCorrupted(false);
    // 초기화하면 누적 정답 0 → 분류 모드는 다시 잠긴다.
    if (modeFromLocation() === "taxonomy") startTaxonomyOrLock();
    else setSession(sessionFromLocation());
  };

  // 좁힌 범위(취약종·복습·서식지)에 종이 없어 문제가 하나도 없으면 빈 세션 대신 안내.
  const isEmptyScope =
    session !== null &&
    session.options.scope !== "all" &&
    session.questions.length === 0;

  return (
    <main className="min-h-screen py-6">
      <TopNav containerClass="max-w-md lg:max-w-4xl" />
      {corrupted && <ProgressResetModal onReset={handleReset} />}
      {!corrupted &&
        (taxoLocked ? (
          <div className="mx-auto w-full max-w-md p-4">
            <Banner tone="pollen" icon="🔒">
              <p>
                분류 퀴즈는 누적 정답{" "}
                <strong>{TAXONOMY_UNLOCK_THRESHOLD}종</strong>을 모으면 열려요.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                현재 {taxoLocked.correct} / {TAXONOMY_UNLOCK_THRESHOLD}
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                <Button href="/quiz">일반 퀴즈로 정답 모으기</Button>
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-500 underline underline-offset-2"
                >
                  홈으로 돌아가기
                </Link>
              </div>
            </Banner>
          </div>
        ) : taxonomy ? (
          <TaxonomyCard session={taxonomy} />
        ) : isEmptyScope ? (
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
            <BirdMascot className="h-16 w-16" />
            <p className="text-gray-600">이 범위에는 아직 학습할 새가 없어요.</p>
            <Link
              href="/"
              className="text-sm font-medium text-green-700 underline underline-offset-2"
            >
              홈으로 돌아가기
            </Link>
          </div>
        ) : session ? (
          session.options.mode === "name-to-photo" ? (
            <PhotoGridQuizCard session={session} />
          ) : (
            <QuizCard session={session} />
          )
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-gray-500">
            <BirdMascot className="h-14 w-14 animate-bounce" />
            <p>퀴즈 준비 중…</p>
          </div>
        ))}
    </main>
  );
}
