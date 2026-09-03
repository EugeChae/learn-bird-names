interface BirdMascotProps {
  className?: string;
  /** 의미 있는 이미지면 라벨을 주고, 순수 장식이면 생략(자동 aria-hidden). */
  label?: string;
}

/**
 * 납작한 벡터 스타일의 귀여운 새 마스코트(팔레트 톤).
 * SVG라 확대해도 깨지지 않고 파일이 작다. 나중에 래스터 일러스트로
 * 바꾸고 싶으면 이 컴포넌트만 교체하면 된다.
 */
export default function BirdMascot({ className, label }: BirdMascotProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* 꼬리 */}
      <path d="M24 56 L4 47 L26 70 Z" fill="#5d7b3d" />
      {/* 몸통 + 머리(한 덩어리 블롭) */}
      <ellipse cx="46" cy="56" rx="30" ry="26" fill="#8bb15e" />
      <circle cx="64" cy="41" r="21" fill="#8bb15e" />
      {/* 머리 깃털 */}
      <path d="M61 24 C 57 12, 68 10, 66 24 Z" fill="#6f9a4a" />
      {/* 밝은 배 */}
      <ellipse cx="50" cy="64" rx="20" ry="15" fill="#f7ead2" />
      {/* 날개 */}
      <path
        d="M42 46 C 30 50, 27 66, 42 74 C 54 68, 53 53, 42 46 Z"
        fill="#6f9a4a"
      />
      <path
        d="M42 52 C 35 55, 33 64, 42 69"
        stroke="#5d7b3d"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* 볼터치 */}
      <circle cx="60" cy="49" r="4.5" fill="#f0a9c2" opacity="0.6" />
      {/* 눈 */}
      <circle cx="69" cy="40" r="3.8" fill="#2b2724" />
      <circle cx="70.4" cy="38.6" r="1.2" fill="#ffffff" />
      {/* 부리 */}
      <path d="M83 42 L95 46 L83 51 Z" fill="#e6a417" />
      {/* 다리 */}
      <g stroke="#e6a417" strokeWidth="2.4" strokeLinecap="round">
        <path d="M44 81 L44 90 M44 90 L40 93 M44 90 L48 93" />
        <path d="M55 81 L55 90 M55 90 L51 93 M55 90 L59 93" />
      </g>
    </svg>
  );
}
