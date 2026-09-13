import type { ReactNode } from "react";

// ─── MobileActionBar · 모바일 하단 고정 액션 바 ───────────────────────────────
// 사진이 세로 공간을 많이 써도 주요 액션(예: "다음")이 항상 스크롤 없이 잡히도록
// 모바일에서는 뷰포트 하단에 고정한다. 데스크톱(lg+)에서는 일반 흐름으로 되돌려
// 2단 레이아웃에 자연스럽게 놓이게 한다. 배경은 크림 토큰(var(--background)).
// 고정 바에 가려지지 않도록 이 바를 쓰는 섹션은 하단 여백(pb-24 lg:pb-4)을 준다.

export default function MobileActionBar({ children }: { children: ReactNode }) {
  return (
    <div
      className={
        "fixed inset-x-0 bottom-0 z-20 border-t border-black/5 " +
        "bg-[var(--background)] px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] " +
        "lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
      }
    >
      <div className="mx-auto w-full max-w-md lg:max-w-none">{children}</div>
    </div>
  );
}
