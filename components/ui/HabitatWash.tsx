"use client";

import { useEffect, useState } from "react";

// ─── HabitatWash · 사진 뒤 수채화 번짐 (프로토타입 D, 파티 세션 2) ─────────────
// 크림 종이와 잎사귀는 그대로 두고, 사진 뒤에 "사진에서 뽑아 밝게 띄운 색" 한 번 칠한다.
// 실사의 회색·갈색을 우리 soft 팔레트 밝기·채도로 끌어올려 산뜻함을 지킨다(Maya·Sally).
// 모양은 사각이 아니라 불규칙 타원 두 개(Caravaggio). 색을 못 뽑으면 서식지 색으로.

const HABITAT_TINT: Record<string, string> = {
  "하천·호수": "#e7f0f9",
  "습지·논": "#e3eef2",
  저수지: "#e7f0f9",
  해안: "#e4eef5",
  "산·숲": "#eaf1e0",
  농경지: "#f1efd9",
  "도시·마을": "#f0ebe3",
};

export function habitatTint(habitat: readonly string[] | undefined): string {
  for (const h of habitat ?? []) if (HABITAT_TINT[h]) return HABITAT_TINT[h];
  return "#efe9df";
}

/** RGB(0~255) → HSL(0~360, 0~1, 0~1). */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

/**
 * 사진의 평균색을 읽어 "밝고 옅은" 물감색으로 바꾼다.
 * 명도는 0.90~0.94로 고정(soft 톤 범위), 채도는 원색의 절반이되 0.25~0.6 사이.
 * 회색 사진(채도 매우 낮음)은 색상을 살짝 하늘색 쪽으로 밀어 칙칙함을 피한다.
 */
export async function washColorFrom(src: string): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = 24; c.height = 24;
    const ctx = c.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, 24, 24);
    const { data } = ctx.getImageData(0, 0, 24, 24);
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
    let [h, s] = rgbToHsl(r / n, g / n, b / n);
    if (s < 0.08) { h = 205; s = 0.3; } // 무채색 사진 → 옅은 하늘
    const sat = Math.min(0.6, Math.max(0.25, s * 1.2));
    return `hsl(${Math.round(h)} ${Math.round(sat * 100)}% 92%)`;
  } catch {
    return undefined;
  }
}

/** 대체안: 사진과 무관하게 사용자 시계의 순간 색(새의 하루 카드와 같은 톤). */
const MOMENT_WASH: Record<string, string> = {
  dawn: "#fce4ec", // blush.soft
  day: "#e7f0f9", // sky.soft
  dusk: "#fbf0cf", // pollen.soft
};

interface HabitatWashProps {
  src?: string;
  habitat?: readonly string[];
  /** photo: 사진에서 색을 뽑음(기본) · moment: 시간대 색만 */
  mode?: "photo" | "moment";
  moment?: "dawn" | "day" | "dusk";
}

export default function HabitatWash({ src, habitat, mode = "photo", moment }: HabitatWashProps) {
  const [color, setColor] = useState<string>(() => habitatTint(habitat));
  useEffect(() => {
    let alive = true;
    if (mode === "moment") {
      setColor(MOMENT_WASH[moment ?? "day"]);
      return;
    }
    setColor(habitatTint(habitat));
    if (!src) return;
    washColorFrom(src).then((c) => { if (alive && c) setColor(c); });
    return () => { alive = false; };
  }, [src, habitat, mode, moment]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-visible">
      {/* 큰 번짐: 사진보다 넓게, 위로 치우쳐 */}
      <div
        className="absolute -left-[12%] -top-[10%] h-[95%] w-[124%] blur-3xl transition-colors duration-700"
        style={{ background: color, opacity: 0.95, borderRadius: "58% 42% 55% 45% / 45% 55% 48% 52%" }}
      />
      {/* 작은 번짐: 오른쪽 아래로 살짝 번진 두 번째 붓질 */}
      <div
        className="absolute left-[18%] top-[22%] h-[78%] w-[98%] blur-2xl transition-colors duration-700"
        style={{ background: color, opacity: 0.7, borderRadius: "45% 55% 40% 60% / 55% 45% 60% 40%" }}
      />
    </div>
  );
}
