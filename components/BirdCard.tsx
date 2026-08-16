"use client";

import { useState } from "react";
import type { Species } from "@/types";
import PhotoModal from "@/components/PhotoModal";

interface BirdCardProps {
  species: Species;
}

/**
 * 오늘의 새 카드 (STORY-005).
 * 대표 사진 + 한국 공식명. 사진 탭 시 확대.
 */
export default function BirdCard({ species }: BirdCardProps) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const photo = species.media[0];

  return (
    <article
      className="flex flex-col gap-3"
      aria-label={`${species.name_korean} 카드`}
    >
      {photo ? (
        <figure className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            aria-label="새 사진 확대"
            className="overflow-hidden rounded-xl border border-gray-200"
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
        <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
          사진 없음
        </div>
      )}

      <h2 className="text-center text-2xl font-bold text-gray-900">
        {species.name_korean}
      </h2>

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
