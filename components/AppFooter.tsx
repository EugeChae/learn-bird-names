"use client";

import { useState } from "react";
import DataReportForm from "@/components/DataReportForm";

/**
 * 앱 최하단 공통 푸터. 접혀 있는 "데이터 오류 신고" 섹션을 모든 페이지에 붙인다.
 * 사진 플래그(🚩)가 "사진 별로예요" 원탭이라면, 여기서는 종 오동정·이름·분류·
 * 설명 오류까지 자유롭게 제기할 수 있다. 저장은 localStorage, 수집은 /flags.
 * 모바일 퀴즈의 하단 고정 액션 바(MobileActionBar)에 가려지지 않도록
 * 아래쪽 여백을 넉넉히 둔다(pb-28 lg:pb-8).
 */
export default function AppFooter() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="mx-auto w-full max-w-md px-4 pb-28 pt-10 lg:max-w-4xl lg:pb-8">
      <div className="rounded-2xl border border-black/5 bg-white/60 p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-gray-700">
            📝 데이터가 잘못됐나요? 알려주세요
          </span>
          <span aria-hidden className="text-gray-400">
            {open ? "▲" : "▼"}
          </span>
        </button>
        {open && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-xs text-gray-500">
              사진 속 새가 다른 종이거나, 이름·분류·서식지·설명이 틀렸다고 생각되면
              적어 주세요. 이 기기에만 저장되고,{" "}
              <a href="/flags" className="underline">
                신고 모아보기
              </a>
              에서 JSON으로 묶어 보낼 수 있어요.
            </p>
            <DataReportForm />
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-[11px] text-gray-400">
        사진은 iNaturalist CC 라이선스 · 설명은 도감·위키백과 출처 표기
      </p>
    </footer>
  );
}
