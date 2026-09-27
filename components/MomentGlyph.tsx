import type { Moment } from "@/lib/moment";

// ─── 순간 글리프 (STORY-017 · 새의 하루) ─────────────────────────────────────
// 지평선 한 줄 + 해 하나. 새벽은 지평선에 반쯤 걸쳐 올라오고, 한낮은 높이 떠 있고,
// 해질녘은 지평선에 걸쳐 내려간다. 세 카드가 같은 형태를 공유해야 "해의 위치"가 읽힌다.
// 이모지를 쓰지 않는 이유: 기기마다 모양이 다르고 크림 배경에서 튄다.
// 색은 currentColor — 감싸는 요소의 text 톤(blush/sky/pollen)을 그대로 받는다.

const SUN: Record<Moment, { cy: number; clip: boolean; rays: boolean }> = {
  dawn: { cy: 14, clip: true, rays: false }, // 반쯤 올라온 해 + 위로 퍼지는 빛
  day: { cy: 8, clip: false, rays: true }, // 높이 뜬 해
  dusk: { cy: 18.5, clip: true, rays: false }, // 지평선 아래로 거의 잠긴 해
};

interface MomentGlyphProps {
  moment: Moment;
  className?: string;
}

export default function MomentGlyph({ moment, className = "" }: MomentGlyphProps) {
  const { cy, clip, rays } = SUN[moment];
  const id = `moment-horizon-${moment}`;
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      {clip && (
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width="24" height="17" />
          </clipPath>
        </defs>
      )}
      <circle cx="12" cy={cy} r="4.2" fill="currentColor" stroke="none" clipPath={clip ? `url(#${id})` : undefined} />
      {rays && (
        <>
          <line x1="12" y1="1.5" x2="12" y2="0.5" />
          <line x1="17.2" y1="2.8" x2="17.8" y2="2.2" />
          <line x1="6.8" y1="2.8" x2="6.2" y2="2.2" />
          <line x1="19" y1="8" x2="20.5" y2="8" />
          <line x1="5" y1="8" x2="3.5" y2="8" />
        </>
      )}
      <line x1="3" y1="17" x2="21" y2="17" />
      {moment === "dawn" && (
        <>
          <line x1="12" y1="2.5" x2="12" y2="4.5" />
          <line x1="6.5" y1="5" x2="7.8" y2="6.3" />
          <line x1="17.5" y1="5" x2="16.2" y2="6.3" />
        </>
      )}
    </svg>
  );
}
