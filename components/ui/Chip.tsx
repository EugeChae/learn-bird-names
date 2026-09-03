import type { ReactNode } from "react";

// ─── Chip · 작은 라벨/배지 개체 ───────────────────────────────────────────────
// 도감 칩(서식지·흔함·철새), 트리비아 유형 배지, 범위 카운트 등에 공용으로 쓴다.

type Tone = "leaf" | "sky" | "blush" | "pollen" | "gray";

const TONE: Record<Tone, string> = {
  leaf: "bg-leaf-soft text-leaf",
  sky: "bg-sky-soft text-sky",
  blush: "bg-blush-soft text-blush",
  pollen: "bg-pollen-soft text-pollen",
  gray: "bg-gray-100 text-gray-600",
};

interface ChipProps {
  tone?: Tone;
  /** 선행 아이콘/이모지(예: "🌿"). */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function Chip({
  tone = "leaf",
  icon,
  className = "",
  children,
}: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
