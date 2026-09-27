"use client";

// ─── AmbientBackdrop · 사진의 장소가 카드 밖으로 번지는 분위기 층 (프로토타입) ────
// 파티 세션 2(2026-09-27, Caravaggio 제안): 사진이 답답한 건 크기가 아니라 경계 때문.
// 같은 사진을 크게 흐려 카드 뒤 페이지에 깔고, 가장자리로 갈수록 크림(--background)으로
// 녹인다. 사진이 오기 전엔 서식지 색이 먼저 온다. 글자 영역(아래)은 늘 크림 위에 있도록
// 세로 페이드가 카드 중간부터 시작한다.
//
// 이름→사진 모드에서는 정답 사진을 배경에 깔면 힌트가 되므로 쓰지 않는다(Dr. Quinn).

const HABITAT_TINT: Record<string, string> = {
  "하천·호수": "#e7f0f9",
  "습지·논": "#e3eef2",
  저수지: "#e7f0f9",
  해안: "#e4eef5",
  "산·숲": "#eaf1e0",
  농경지: "#f1efd9",
  "도시·마을": "#f0ebe3",
};

interface AmbientBackdropProps {
  /** 로드된 사진 URL. 없으면 서식지 색만. */
  src?: string;
  habitat?: readonly string[];
  /** 사진을 배경에 깔지(홈·사진→이름 O, 이름→사진 X). */
  usePhoto?: boolean;
}

export function habitatTint(habitat: readonly string[] | undefined): string {
  for (const h of habitat ?? []) if (HABITAT_TINT[h]) return HABITAT_TINT[h];
  return "var(--background)";
}

export default function AmbientBackdrop({ src, habitat, usePhoto = true }: AmbientBackdropProps) {
  const tint = habitatTint(habitat);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-x-6 -top-10 bottom-0 -z-10 overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 30%, ${tint} 0%, var(--background) 75%)` }}
    >
      {usePhoto && src && (
        /* eslint-disable-next-line @next/next/no-img-element -- 장식용 복제 */
        <img
          src={src}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-55 blur-2xl saturate-[.8]"
        />
      )}
      {/* 가장자리로 갈수록 크림으로: 아래는 글자 영역, 좌우는 페이지 여백 */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(to bottom, transparent 35%, var(--background) 92%)",
            "linear-gradient(to right, var(--background) 0%, transparent 18%, transparent 82%, var(--background) 100%)",
            "linear-gradient(to top, transparent 70%, var(--background) 100%)",
          ].join(","),
        }}
      />
    </div>
  );
}
