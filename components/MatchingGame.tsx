"use client";

import { useEffect, useMemo, useState } from "react";
import type { MatchingPair } from "@/types";
import BirdPhoto from "@/components/ui/BirdPhoto";
import PhotoModal from "@/components/PhotoModal";

interface MatchingGameProps {
  pairs: MatchingPair[];
  onComplete: () => void;
}

/** Fisher-Yates 셔플. 좌/우 열을 각각 섞어 정답이 같은 행에 나란히 오지 않게 한다. */
function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 세션 마무리 짝짓기 복습 게임 (STORY-013 / FR-014).
 * 왼쪽 사진 열 · 오른쪽 이름 열을 탭-투-매치로 짝짓는다. 사진 하나 + 이름 하나를
 * 고르면 판정 — 같은 종이면 매치(잠금), 아니면 재선택. 1번에 맞힌 종(wasEasy)은
 * 처음부터 완료(흐리게) 상태라 어려웠던 종에만 집중한다(AC3). 모두 맞추면 onComplete.
 *
 * pairs 주입형이라 결정론적으로 테스트할 수 있다. 사진 버튼은 정답을 노출하지
 * 않으려고 data-species-id로만 종을 식별한다(화면·접근성 트리에 이름 미노출).
 *
 * 레이아웃(2026-09-27 cleor): 사진 열은 정사각 타일, 이름 열은 낮은 버튼이라 두 열의
 * 높이가 달라 아래 사진과 위 이름 사이를 오르내려야 했다. 이제 두 열의 행 높이를 같게
 * 고정(ROW)해 n번째 사진과 n번째 이름이 항상 나란히 있고, 사진은 작아진 대신 🔍로 확대한다.
 */
const ROW = "h-24 lg:h-28";
export default function MatchingGame({ pairs, onComplete }: MatchingGameProps) {
  const [matched, setMatched] = useState<Set<string>>(
    () => new Set(pairs.filter((p) => p.wasEasy).map((p) => p.species.id))
  );
  const [selPhoto, setSelPhoto] = useState<string | null>(null);
  const [selName, setSelName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"match" | "mismatch" | null>(null);

  // 마운트 시 1회 고정 셔플(pairs 참조는 부모가 memo로 안정화).
  const photoOrder = useMemo(() => shuffle(pairs), [pairs]);
  const nameOrder = useMemo(() => shuffle(pairs), [pairs]);
  const total = pairs.length;

  useEffect(() => {
    if (total > 0 && matched.size === total) onComplete();
  }, [matched, total, onComplete]);

  const tryMatch = (photoId: string, nameId: string) => {
    if (photoId === nameId) {
      setMatched((prev) => new Set(prev).add(photoId));
      setFeedback("match");
    } else {
      setFeedback("mismatch");
    }
    setSelPhoto(null);
    setSelName(null);
  };

  const onPhoto = (id: string) => {
    if (matched.has(id)) return;
    setFeedback(null);
    if (selName != null) tryMatch(id, selName);
    else setSelPhoto(id);
  };

  const onName = (id: string) => {
    if (matched.has(id)) return;
    setFeedback(null);
    if (selPhoto != null) tryMatch(selPhoto, id);
    else setSelName(id);
  };

  const [zoomId, setZoomId] = useState<string | null>(null);
  const zoomPair = pairs.find((p) => p.species.id === zoomId);
  const zoomPhoto = zoomPair?.species.media[0];

  const photoClass = (isMatched: boolean, isSel: boolean) => {
    const base = `block ${ROW} w-24 overflow-hidden rounded-lg border-2 transition disabled:cursor-default lg:w-28`;
    if (isMatched) return `${base} border-leaf/60 opacity-40`;
    if (isSel) return `${base} border-sky ring-2 ring-sky/40`;
    return `${base} border-gray-200 hover:border-gray-400`;
  };

  const nameClass = (isMatched: boolean, isSel: boolean) => {
    const base = `flex ${ROW} w-full items-center rounded-lg border-2 px-4 text-lg font-medium transition disabled:cursor-default`;
    if (isMatched)
      return `${base} border-leaf/60 bg-leaf-soft text-leaf-deep opacity-40`;
    if (isSel)
      return `${base} border-sky bg-sky-soft text-sky-deep ring-2 ring-sky/40`;
    return `${base} border-gray-300 bg-white text-gray-900 hover:border-gray-500`;
  };

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 lg:max-w-lg"
      aria-label="세션 완료 · 짝짓기 복습"
    >
      <h2 className="text-2xl font-bold">짝짓기 복습</h2>
      <p className="text-sm text-gray-500">
        사진과 이름을 짝지어 보세요. 흐린 항목은 1번에 맞힌 새예요.
      </p>
      <p className="text-sm text-gray-600" aria-live="polite">
        {matched.size} / {total} 짝
        {feedback === "mismatch" && (
          <span className="ml-2 font-medium text-petal">
            짝이 아니에요. 다시 골라보세요.
          </span>
        )}
      </p>

      {/* 두 열의 행 높이가 같아(ROW) n번째 사진과 n번째 이름이 항상 같은 줄에 있다. */}
      <div className="flex gap-3">
        <ul className="flex shrink-0 flex-col gap-2" aria-label="사진">
          {photoOrder.map((p) => {
            const isMatched = matched.has(p.species.id);
            const isSel = selPhoto === p.species.id;
            const photo = p.species.media[0];
            return (
              <li key={p.species.id} className="relative">
                <button
                  type="button"
                  data-species-id={p.species.id}
                  onClick={() => onPhoto(p.species.id)}
                  disabled={isMatched}
                  aria-pressed={isSel}
                  aria-label={isMatched ? "새 사진 (완료)" : "새 사진 후보"}
                  className={photoClass(isMatched, isSel)}
                >
                  {photo ? (
                    <BirdPhoto src={photo.url} alt="" className="h-full w-full" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      사진 없음
                    </span>
                  )}
                </button>
                {photo && !isMatched && (
                  <button
                    type="button"
                    onClick={() => setZoomId(p.species.id)}
                    aria-label="사진 확대"
                    className="absolute right-1 top-1 rounded-full bg-black/50 px-1.5 py-0.5 text-xs text-white hover:bg-black/70"
                  >
                    🔍
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <ul className="flex min-w-0 flex-1 flex-col gap-2" aria-label="이름">
          {nameOrder.map((p) => {
            const isMatched = matched.has(p.species.id);
            const isSel = selName === p.species.id;
            return (
              <li key={p.species.id}>
                <button
                  type="button"
                  data-species-id={p.species.id}
                  onClick={() => onName(p.species.id)}
                  disabled={isMatched}
                  aria-pressed={isSel}
                  className={nameClass(isMatched, isSel)}
                >
                  {p.species.name_korean}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {zoomPhoto && (
        <PhotoModal
          src={zoomPhoto.url}
          alt="새 사진 확대"
          attribution={zoomPhoto.attribution}
          onClose={() => setZoomId(null)}
        />
      )}
    </section>
  );
}
