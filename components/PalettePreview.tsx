"use client";

import { useEffect } from "react";

/**
 * 개발 전용 팔레트 미리보기: ?palette=p1|p2 (구 후보 비교용) → <html data-palette="...">.
 * 프로덕션 빌드에서는 아무것도 하지 않는다. 디자인 시스템 후보 비교용(2026-09-27).
 */
export default function PalettePreview() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const v = new URLSearchParams(window.location.search).get("palette");
    if (v === "p1" || v === "p2") document.documentElement.dataset.palette = v;
    else delete document.documentElement.dataset.palette;
  }, []);
  return null;
}
