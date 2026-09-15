"use client";

import { useEffect, useState } from "react";
import {
  getFlags,
  unflagPhoto,
  clearFlags,
  type PhotoFlag,
} from "@/lib/photoFlags.store";
import {
  getReports,
  removeReport,
  clearReports,
  REPORT_CATEGORY_LABEL,
  type DataReport,
} from "@/lib/dataReports.store";
import TopNav from "@/components/TopNav";

/**
 * 사진 변경요청 + 데이터 오류 신고 모아보기 (큐레이터용). localStorage에 쌓인
 * 플래그·신고를 목록으로 보여주고, 개별 제거·전체 비우기·JSON 복사/다운로드로
 * 배치 교체·데이터 수정 작업에 넘긴다.
 * 정적 export라 localStorage는 마운트 후에만 읽는다(하이드레이션 안전).
 */
export default function FlagsPage() {
  const [flags, setFlags] = useState<PhotoFlag[]>([]);
  const [reports, setReports] = useState<DataReport[]>([]);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedReports, setCopiedReports] = useState(false);

  useEffect(() => {
    setFlags(getFlags());
    setReports(getReports());
    setMounted(true);
  }, []);

  const refresh = () => {
    setFlags(getFlags());
    setReports(getReports());
  };

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

  const download = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => download(json, "photo-flags.json");

  // ── 데이터 오류 신고 ──
  const reportsJson = JSON.stringify(reports, null, 2);

  const handleRemoveReport = (id: string) => {
    removeReport(id);
    refresh();
  };

  const handleClearReports = () => {
    if (reports.length === 0) return;
    if (!window.confirm(`오류 신고 ${reports.length}건을 모두 지울까요?`)) return;
    clearReports();
    refresh();
  };

  const handleCopyReports = async () => {
    try {
      await navigator.clipboard.writeText(reportsJson);
      setCopiedReports(true);
      window.setTimeout(() => setCopiedReports(false), 1500);
    } catch {
      setCopiedReports(false);
    }
  };

  return (
    <>
      <TopNav
        containerClass="max-w-2xl"
        right={
          <a
            href="/quiz"
            className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
          >
            퀴즈로 →
          </a>
        }
      />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
        <header className="flex flex-col gap-1">
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

      <section className="mt-6 flex flex-col gap-3" aria-labelledby="reports-heading">
        <header className="flex flex-col gap-1">
          <h2 id="reports-heading" className="text-xl font-bold">📝 데이터 오류 신고</h2>
          <p className="text-sm text-gray-600">
            종 오동정·이름·분류·서식지·설명 오류 제보예요. 앱 맨 아래 폼에서 작성합니다.
          </p>
        </header>
        {!mounted ? null : reports.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-400">
            아직 신고가 없어요. 페이지 맨 아래 &quot;데이터가 잘못됐나요?&quot;에서 알려주세요.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                신고 {reports.length}건
              </span>
              <button
                type="button"
                onClick={handleCopyReports}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
              >
                {copiedReports ? "복사됨 ✓" : "신고 JSON 복사"}
              </button>
              <button
                type="button"
                onClick={() => download(reportsJson, "data-reports.json")}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                다운로드
              </button>
              <button
                type="button"
                onClick={handleClearReports}
                className="ml-auto rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                신고 전체 비우기
              </button>
            </div>
            <ul className="flex flex-col gap-3">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      {r.nameKorean || "(종 미지정)"}{" "}
                      {r.speciesId && (
                        <span className="text-xs font-normal text-gray-400">
                          ({r.speciesId})
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-medium text-orange-700">
                      {REPORT_CATEGORY_LABEL[r.category]}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {r.detail}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {r.page} · {r.reportedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveReport(r.id)}
                    aria-label={`${r.nameKorean || "종 미지정"} 신고 제거`}
                    className="flex-shrink-0 rounded-md px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    제거
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      </main>
    </>
  );
}
