interface MilestoneBannerProps {
  /** 달성한 연속 정답 수 (5·10에서 표시). */
  streak: number;
}

/** 마일스톤별 메시지. 텍스트 우선 + 이모지 1개만(아이콘 최소화, FR-011/STORY-012). */
const MESSAGES: Record<number, string> = {
  5: "5연속 정답! 잘하고 있어요 🔥",
  10: "10연속 정답! 최고예요 🎉",
};

/**
 * 연속 정답 마일스톤 배너 (STORY-012).
 * 일반 정답 피드백과 구별되도록 별도 배경 + 부드러운 등장 애니메이션을 주되,
 * 텍스트를 앞세우고 아이콘은 최소화한다. 카드의 aria-live 영역 안에서 렌더되어
 * 스크린리더로도 알려진다. prefers-reduced-motion이면 애니메이션을 끈다.
 */
export default function MilestoneBanner({ streak }: MilestoneBannerProps) {
  const message = MESSAGES[streak] ?? `${streak}연속 정답! 대단해요 🔥`;
  return (
    <p className="mt-1 animate-milestone-pop rounded-lg bg-orange-100 px-4 py-2 text-center text-lg font-bold text-orange-700 motion-reduce:animate-none">
      {message}
    </p>
  );
}
