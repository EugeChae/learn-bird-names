"use client";

import { useEffect, useState } from "react";
import {
  getFlags,
  unflagPhoto,
  clearFlags,
  type PhotoFlag,
} from "@/lib/photoFlags.store";

/**
 * 사진 변경요청 모아보기 (큐레이터용). localStorage에 쌓인 플래그를 목록으로 보여주고,
 * 개별 제거·전체 비우기·JSON 복사/다운로드로 배치 교체 작업에 넘긴다.
 * 정적 export라 localStorage는 마운트 후에만 읽는다(하이드레이션 안전).
 */
export default function FlagsPage() {
  const [flags, setFlags] = useState<PhotoFlag[]>([]);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFlags(getFlags());
    setMounted(true);
  }, []);

  const refresh = () => setFlags(getFlags());

  const handleRemove = (photoUrl: string) => {
    unflagPhoto(photoUrl);
    refresh();
  };

  const handleClear = () => {
    if (flags.length === 0) return;
    if (!window.confirm(`변경요청 ${flags.length}건을 모두 지울까요?`)) return;
    clearFlags();
    refresh();
  };

  const json = JSON.stringify(flags, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "photo-flags.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <a
          href="/quiz"
          className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600"
        >
          ← 퀴즈로
        </a>
        <h1 className="text-2xl font-bold">🚩 사진 변경요청</h1>
        <p className="text-sm text-gray-600">
          퀴즈를 풀다 별로였던 사진들이에요. 이 목록을 배치로 교체합니다.
        </p>
      </header>

      {!mounted ? (
        <p className="text-gray-400">불러오는 중…</p>
      ) : flags.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-400">
          변경요청한 사진이 없어요. 퀴즈 사진 아래 🚩 버튼으로 표시하세요.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              총 {flags.length}건
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              {copied ? "복사됨 ✓" : "JSON 복사"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              다운로드
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              전체 비우기
            </button>
          </div>

          <ul className="flex flex-col gap-3">
            {flags.map((f) => (
              <li
                key={f.photoUrl}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- unoptimized static export; next/image adds no value here */}
                <img
                  src={f.photoUrl}
                  alt={f.nameKorean}
                  className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">
                    {f.nameKorean}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({f.speciesId})
                    </span>
                  </p>
                  <p className="truncate text-xs text-gray-500">{f.photoUrl}</p>
                  <p className="text-[10px] text-gray-400">{f.flaggedAt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(f.photoUrl)}
                  aria-label={`${f.nameKorean} 변경요청 제거`}
                  className="flex-shrink-0 rounded-md px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 hover:text-red-600"
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
