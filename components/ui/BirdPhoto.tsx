"use client";

import { useEffect, useRef, useState } from "react";
import { knownPhotoRatio, rememberPhotoRatio } from "@/lib/photo-preload";

// ─── BirdPhoto · 새 사진 공용 개체 ─────────────────────────────────────────────
// 사진은 iNaturalist S3(미국 동부)에서 오므로 한국에서 첫 바이트까지 0.8~1.2초 걸린다.
// 그 사이 빈 흰 상자만 보이면 "문제가 넘어간 건가?"가 헷갈린다(2026-09-27 cleor).
// 규칙:
//  1) src가 바뀌는 순간 즉시 자리표시자(연한 잎색 + 잔잔한 펄스)로 바꾼다 — 화면이 바뀌었다는 신호.
//  2) 로드가 끝나면 사진을 살짝 페이드인한다. 캐시된 사진은 페이드 없이 바로.
//  3) 실패하면 "사진을 못 불러왔어요"를 같은 자리에 보여 준다(레이아웃 유지).
// 크기 클래스(h-[30vh]·aspect-square 등)는 감싸는 상자에 주고, img는 상자를 꽉 채운다.

// natural(선택지 A, 파티 세션 2 결정): 상자가 사진 비율을 따라간다 — 여백 0, 잘림 0.
// 비율을 이미 알면(미리 받음·한 번 표시) 처음부터 그 비율, 모르면 4:3으로 잡았다가 로드 후 바뀐다.
// 높이는 화면의 capVh%에서 멈추고, 그때는 폭이 줄어 가운데 선다(액자 없음, 크림 배경 위 사진).
type Fit = "cover" | "contain" | "natural";
const FALLBACK_RATIO = 4 / 3;

interface BirdPhotoProps {
  src: string;
  alt: string;
  /** 감싸는 상자의 크기·모양 클래스. */
  className?: string;
  fit?: Fit;
  /** 첫 화면의 주인공 사진이면 true — lazy 없이 바로 받는다. (fetchpriority는 React 18이 경고해 안 쓴다) */
  priority?: boolean;
  /** 이미지 요소에 직접 줄 추가 클래스(rounded 등). */
  imgClassName?: string;
  /** fit="natural"일 때 최대 높이(vh). 기본 70. */
  capVh?: number;
}

type Phase = "loading" | "loaded" | "error";

export default function BirdPhoto({
  src,
  alt,
  className = "",
  fit = "cover",
  priority = false,
  imgClassName = "",
  capVh = 70,
}: BirdPhotoProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [ratio, setRatio] = useState<number | undefined>(() => knownPhotoRatio(src));
  const [instant, setInstant] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // src가 바뀌면 자리표시자로 되돌린다. 이미 캐시에 있으면(complete) 페이드 없이 바로 보인다.
  useEffect(() => {
    const img = imgRef.current;
    setRatio(knownPhotoRatio(src));
    if (img && img.complete && img.naturalWidth > 0 && img.currentSrc.endsWith(src)) {
      rememberPhotoRatio(src, img.naturalWidth, img.naturalHeight);
      setRatio(img.naturalWidth / img.naturalHeight);
      setInstant(true);
      setPhase("loaded");
      return;
    }
    setInstant(false);
    setPhase("loading");
  }, [src]);

  const onLoad = () => {
    const img = imgRef.current;
    if (img && img.naturalWidth > 0) {
      rememberPhotoRatio(src, img.naturalWidth, img.naturalHeight);
      setRatio(img.naturalWidth / img.naturalHeight);
    }
    setPhase("loaded");
  };

  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  const r = ratio ?? FALLBACK_RATIO;
  // natural: 폭 = min(컨테이너 폭, 캡 높이 × 비율). 캡에 걸리면 폭이 줄고 mx-auto로 가운데.
  const naturalStyle =
    fit === "natural"
      ? { aspectRatio: `${r}`, width: `min(100%, calc(${capVh}vh * ${r}))`, transition: "width 250ms ease" }
      : undefined;

  return (
    <div
      className={`relative overflow-hidden bg-leaf-soft ${fit === "natural" ? "mx-auto" : ""} ${className}`}
      style={naturalStyle}
      data-photo-phase={phase}
      data-photo-ratio={ratio?.toFixed(2)}
    >
      {phase === "loading" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-photo-pulse bg-gradient-to-br from-leaf-soft via-white/60 to-leaf-soft"
        />
      )}
      {phase === "error" ? (
        <div
          role="img"
          aria-label={`${alt} (불러오기 실패)`}
          className="absolute inset-0 flex items-center justify-center text-xs text-gray-400"
        >
          사진을 못 불러왔어요
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element -- unoptimized static export; next/image adds no value here */
        <img
          ref={imgRef}
          key={src}
          src={src}
          alt={alt}
          crossOrigin="anonymous"
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          onLoad={onLoad}
          onError={() => setPhase("error")}
          className={`absolute inset-0 h-full w-full ${fitClass} ${
            instant ? "" : "transition-opacity duration-300"
          } ${phase === "loaded" ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      )}
    </div>
  );
}
