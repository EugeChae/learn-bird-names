"use client";

import Link from "next/link";

interface TopNavProps {
  /** 우측에 표시할 보조 액션(선택). */
  right?: React.ReactNode;
  /** 컨테이너 최대 폭(페이지 본문 폭에 맞춘다). 기본 max-w-md. */
  containerClass?: string;
}

/**
 * 서브 페이지 공통 상단 바. 왼쪽에 뒤로가기(브라우저 히스토리)와 홈 링크를
 * 항상 제공해, 퀴즈·진도·플래그 어디서든 빠져나올 수 있게 한다.
 * 정적 export라 히스토리 접근은 클릭 시(클라이언트)에만 일어난다.
 */
export default function TopNav({
  right,
  containerClass = "max-w-md",
}: TopNavProps) {
  return (
    <nav
      className={`mx-auto flex w-full ${containerClass} items-center justify-between px-4 pb-1 pt-2`}
      aria-label="페이지 이동"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="뒤로 가기"
          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          ← 뒤로
        </button>
        <Link
          href="/"
          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          🏠 홈
        </Link>
      </div>
      {right}
    </nav>
  );
}
