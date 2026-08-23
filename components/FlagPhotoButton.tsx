"use client";

import { useEffect, useState } from "react";
import {
  isFlagged,
  toggleFlag,
  type FlagDeps,
  type PhotoFlagInput,
} from "@/lib/photoFlags.store";

interface FlagPhotoButtonProps extends PhotoFlagInput {
  className?: string;
  /** 테스트용 스토어 주입. 생략 시 실제 localStorage를 사용한다. */
  deps?: FlagDeps;
}

/**
 * 사진 변경요청(플래그) 원탭 버튼. 정답을 노출하지 않고 조용히 기록/토글한다.
 * localStorage 접근은 클라이언트에서만 하므로, 마운트 후 상태를 읽어
 * 정적 프리렌더와의 하이드레이션 불일치를 피한다.
 */
export default function FlagPhotoButton({
  speciesId,
  nameKorean,
  photoUrl,
  className = "",
  deps,
}: FlagPhotoButtonProps) {
  const [flagged, setFlagged] = useState(false);

  useEffect(() => {
    setFlagged(isFlagged(photoUrl, deps));
  }, [photoUrl, deps]);

  const onClick = () => {
    const { flagged: next } = toggleFlag(
      { speciesId, nameKorean, photoUrl },
      deps
    );
    setFlagged(next);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={flagged}
      aria-label={
        flagged ? "사진 변경요청됨. 다시 누르면 취소" : "이 사진 변경요청하기"
      }
      title={
        flagged ? "변경요청됨 — 다시 누르면 취소" : "이 사진이 별로면 변경요청"
      }
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
        flagged
          ? "bg-orange-100 text-orange-700"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      } ${className}`}
    >
      <span aria-hidden>{flagged ? "✅" : "🚩"}</span>
      {flagged ? "변경요청됨" : "사진 별로예요"}
    </button>
  );
}
