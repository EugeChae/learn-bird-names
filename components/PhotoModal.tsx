"use client";

import { useEffect } from "react";

interface PhotoModalProps {
  src: string;
  alt: string;
  attribution: string;
  onClose: () => void;
}

/** 새 사진 확대 뷰. 오버레이/닫기 버튼/Escape로 닫는다. */
export default function PhotoModal({
  src,
  alt,
  attribution,
  onClose,
}: PhotoModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="새 사진 확대"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 p-4"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- unoptimized static export; next/image adds no value here */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] max-w-full rounded-lg object-contain"
      />
      <p className="max-w-md text-center text-xs text-gray-300">{attribution}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white"
      >
        닫기
      </button>
    </div>
  );
}
