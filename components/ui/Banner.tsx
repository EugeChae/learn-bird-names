import type { ReactNode } from "react";

// ─── Banner · 안내/축하 배너 개체 ─────────────────────────────────────────────
// 분류 잠금 안내, 잠금 해제 축하, 빈 범위 안내 등 "한 마디 알림"에 쓴다.
// 둥근 카드 + 톤 배경 + (선택) 큰 아이콘 + 제목(손글씨) + 본문.

type Tone = "leaf" | "pollen" | "sky" | "blush";

const TONE: Record<Tone, string> = {
  leaf: "border-leaf/20 bg-leaf-soft",
  pollen: "border-pollen/30 bg-pollen-soft",
  sky: "border-sky/30 bg-sky-soft",
  blush: "border-blush/30 bg-blush-soft",
};

interface BannerProps {
  tone?: Tone;
  /** 큰 이모지/아이콘(선택). */
  icon?: ReactNode;
  /** 제목(선택). 있으면 Gaegu 손글씨로. */
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export default function Banner({
  tone = "pollen",
  icon,
  title,
  className = "",
  children,
}: BannerProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border px-5 py-6 text-center shadow-soft ${TONE[tone]} ${className}`}
    >
      {icon && <div className="text-3xl">{icon}</div>}
      {title && (
        <p className="font-display text-xl text-gray-900">{title}</p>
      )}
      {children && <div className="text-gray-700">{children}</div>}
    </div>
  );
}
