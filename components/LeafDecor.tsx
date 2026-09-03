interface LeafDecorProps {
  /** 위치·크기·회전은 부모에서 className으로 준다(예: "absolute -top-3 -right-2 h-16 w-16 rotate-12"). */
  className?: string;
}

/** 한 장의 잎(원점에 붙는 뾰족한 타원 + 잎맥). */
function Leaf({
  x,
  y,
  rot,
  fill,
  scale = 1,
}: {
  x: number;
  y: number;
  rot: number;
  fill: string;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      <path
        d="M0 0 C 6 -6, 16 -6, 22 0 C 16 6, 6 6, 0 0 Z"
        fill={fill}
      />
      <path d="M2 0 H 20" stroke="#4c6a34" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}

/**
 * 장식용 잎사귀 스프라이그(레퍼런스의 떠다니는 잎 모티프).
 * 순수 장식이므로 aria-hidden. 색은 두 톤 초록 + 옅은 톤.
 */
export default function LeafDecor({ className }: LeafDecorProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* 줄기 */}
      <path
        d="M36 70 C 33 52, 33 30, 40 6"
        stroke="#7c9a54"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <Leaf x={34} y={50} rot={202} fill="#8bb15e" />
      <Leaf x={35} y={40} rot={-22} fill="#6f9a4a" />
      <Leaf x={33} y={30} rot={200} fill="#a6c77e" scale={0.9} />
      <Leaf x={37} y={20} rot={-18} fill="#7ba653" scale={0.9} />
      <Leaf x={39} y={10} rot={-30} fill="#a6c77e" scale={0.7} />
    </svg>
  );
}
