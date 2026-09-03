"use client";

import { useState } from "react";
import type { Species } from "@/types";
import PhotoModal from "@/components/PhotoModal";
import LeafDecor from "@/components/LeafDecor";
import Chip from "@/components/ui/Chip";
import { abundanceKo, statusKo } from "@/lib/bird-labels";

interface BirdCardProps {
  species: Species;
}

/**
 * 오늘의 새 카드 (STORY-005) — 귀여운 도감 스타일.
 * 대표 사진 + 한국 공식명 + 학명 + 도감 칩(흔함·철새 구분·서식지). 사진 탭 시 확대.
 */
export default function BirdCard({ species }: BirdCardProps) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const photo = species.media[0];
  const abundance = abundanceKo(species.abundance);
  const statuses = statusKo(species.status);

  return (
    <article
      className="relative flex flex-col gap-3"
      aria-label={`${species.name_korean} 카드`}
    >
      {/* 떠다니는 잎사귀 장식 (레퍼런스 모티프) */}
      <LeafDecor className="pointer-events-none absolute -right-3 -top-5 z-10 h-16 w-16 rotate-[18deg]" />

      {photo ? (
        <figure className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            aria-label="새 사진 확대"
            className="overflow-hidden rounded-2xl border border-gray-200 shadow-soft"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- unoptimized static export; next/image adds no value here */}
            <img
              src={photo.url}
              alt={species.name_korean}
              className="aspect-square w-full object-cover"
            />
          </button>
          <figcaption className="text-right text-[10px] text-gray-400">
            {photo.attribution}
          </figcaption>
        </figure>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-gray-300 text-gray-400">
          사진 없음
        </div>
      )}

      <div className="flex flex-col items-center gap-0.5">
        <h2 className="text-center text-4xl font-bold text-gray-900">
          {species.name_korean}
        </h2>
        <p className="text-sm italic text-gray-400">{species.name_latin}</p>
      </div>

      {/* 도감 칩: 흔함(blush) · 철새 구분(sky) · 서식지(leaf) */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {abundance && <Chip tone="blush">{abundance}</Chip>}
        {statuses.map((s) => (
          <Chip key={s} tone="sky">
            {s}
          </Chip>
        ))}
        {species.habitat.map((h) => (
          <Chip key={h} tone="leaf" icon="🌿">
            {h}
          </Chip>
        ))}
      </div>

      {photoOpen && photo && (
        <PhotoModal
          src={photo.url}
          alt={species.name_korean}
          attribution={photo.attribution}
          onClose={() => setPhotoOpen(false)}
        />
      )}
    </article>
  );
}
