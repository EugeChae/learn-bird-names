"use client";

import Link from "next/link";
import type { TaxonomySession, TaxonomyChoice } from "@/types";
import { useTaxonomyProgress } from "@/hooks/useTaxonomyProgress";
import { familyKo } from "@/lib/taxonomy-labels";
import MilestoneBanner from "@/components/MilestoneBanner";

/**
 * Taxonomy 퀴즈 카드 (STORY-014 / FR-015). 한 세션에 3가지 유형을 섞어 낸다.
 * 진행 규칙(재시도·힌트·스트릭)은 useTaxonomyProgress 공용 훅에 있다(STORY-012 AC4 충족).
 *  - photo-to-taxon: 사진 + 목/과 4지선다(텍스트 보기)
 *  - odd-one-out / family-membership: 종 4장(사진+한국명) 보기. 정답 공개 시 과(科) 이름도 표시.
 */
export default function TaxonomyCard({ session }: { session: TaxonomySession }) {
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
  } = useTaxonomyProgress(session);

  if (done || !question) {
    const correct = session.questions.filter(
      (q) => q.resolvedCorrect === true
    ).length;
    const incorrect = session.questions.filter(
      (q) => q.resolvedCorrect === false
    ).length;
    return (
      <section
        className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 lg:max-w-4xl"
        aria-label="분류 퀴즈 결과"
      >
        <h2 className="text-2xl font-bold">분류 퀴즈 완료!</h2>
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-gray-200 py-3">
            <dt className="text-xs text-gray-500">정답</dt>
            <dd className="text-2xl font-bold text-green-700">{correct}</dd>
          </div>
          <div className="rounded-lg border border-gray-200 py-3">
            <dt className="text-xs text-gray-500">오답</dt>
            <dd className="text-2xl font-bold text-red-600">{incorrect}</dd>
          </div>
          <div className="rounded-lg border border-gray-200 py-3">
            <dt className="text-xs text-gray-500">최고 연속</dt>
            <dd className="text-2xl font-bold text-gray-900">
              🔥 {session.maxStreak}
            </dd>
          </div>
        </dl>
        <div className="flex flex-col gap-2">
          <Link
            href="/quiz?mode=taxonomy"
            className="rounded-lg bg-green-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-green-700"
          >
            새 분류 퀴즈
          </Link>
          <Link
            href="/"
            className="text-center text-sm font-medium text-gray-500 underline underline-offset-2"
          >
            홈으로
          </Link>
        </div>
      </section>
    );
  }

  const promptText =
    question.type === "photo-to-taxon"
      ? question.taxonLevel === "order"
        ? "이 새는 어느 목(目)에 속할까요?"
        : "이 새는 어느 과(科)에 속할까요?"
      : question.type === "odd-one-out"
        ? "이 중 무리(科)가 다른 새는?"
        : question.askBelongs
          ? `'${question.familyLabel}'에 속하는 새는?`
          : `'${question.familyLabel}'에 속하지 않는 새는?`;

  const speciesChoices = question.type !== "photo-to-taxon";

  const stateClass = (id: string, base: string) => {
    if (resolved && id === question.correctId)
      return `${base} border-green-500 bg-green-50 text-green-800`;
    if (wrongIds.includes(id))
      return `${base} border-red-400 bg-red-50 text-red-700`;
    return `${base} border-gray-300 bg-white text-gray-900 hover:border-gray-500`;
  };

  const promptPhoto = question.promptSpecies?.media[0];

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 lg:max-w-4xl"
      aria-label="분류 퀴즈"
    >
      <header className="flex items-center justify-between text-sm text-gray-600">
        <span>
          문제 {position} / {session.questions.length}
        </span>
        <span aria-label={`연속 정답 ${session.streak}`}>
          🔥 연속 <strong className="text-gray-900">{session.streak}</strong>
        </span>
      </header>

      {question.type === "photo-to-taxon" && promptPhoto && (
        <figure className="flex flex-col gap-1">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- unoptimized static export */}
            <img
              src={promptPhoto.url}
              alt="분류를 맞혀야 할 새 사진"
              className="aspect-square w-full object-cover"
            />
          </div>
          <figcaption className="text-right text-[10px] text-gray-400">
            {promptPhoto.attribution}
          </figcaption>
        </figure>
      )}

      <p className="text-lg font-semibold text-gray-900">{promptText}</p>

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

      {speciesChoices ? (
        <ul className="grid grid-cols-2 gap-3">
          {question.choices.map((c, i) => (
            <li key={c.id}>
              <SpeciesChoiceButton
                choice={c}
                index={i}
                revealed={resolved}
                className={stateClass(
                  c.id,
                  "flex w-full flex-col gap-1 rounded-lg border p-2 text-left transition disabled:cursor-not-allowed"
                )}
                disabled={resolved || wrongIds.includes(c.id)}
                onSelect={() => select(c.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {question.choices.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => select(c.id)}
                disabled={resolved || wrongIds.includes(c.id)}
                className={stateClass(
                  c.id,
                  "w-full rounded-lg border px-4 py-3 text-left text-base font-medium transition disabled:cursor-not-allowed"
                )}
              >
                <span className="mr-2 text-gray-400">{i + 1}</span>
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite" className="min-h-[3rem]">
        {status === "correct" && (
          <p className="font-semibold text-green-700">정답입니다! 🎉</p>
        )}
        {status === "answering" && wrongIds.length > 0 && (
          <p className="font-medium text-red-600">틀렸어요. 다시 시도해 보세요.</p>
        )}
        {status === "revealed" && (
          <p className="font-medium text-gray-800">
            정답은{" "}
            <strong>
              {question.choices.find((c) => c.id === question.correctId)?.label}
            </strong>{" "}
            이에요.
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
    </section>
  );
}

/** 종 보기(사진+한국명). 정답 공개 시 과(科) 이름도 표시(유형3 AC). */
function SpeciesChoiceButton({
  choice,
  index,
  revealed,
  disabled,
  className,
  onSelect,
}: {
  choice: TaxonomyChoice;
  index: number;
  revealed: boolean;
  disabled: boolean;
  className: string;
  onSelect: () => void;
}) {
  const photo = choice.species?.media[0];
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={className}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- unoptimized static export
        <img
          src={photo.url}
          alt={choice.label}
          className="aspect-square w-full rounded-md object-cover"
        />
      ) : (
        <span className="flex aspect-square w-full items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
          사진 없음
        </span>
      )}
      <span className="text-sm font-medium">
        <span className="mr-1 text-gray-400">{index + 1}</span>
        {choice.label}
      </span>
      {revealed && choice.species && (
        <span className="text-xs text-gray-500">
          {familyKo(choice.species.family)}
        </span>
      )}
    </button>
  );
}
