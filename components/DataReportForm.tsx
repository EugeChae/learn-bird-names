"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import {
  addReport,
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABEL,
  type ReportCategory,
  type ReportDeps,
} from "@/lib/dataReports.store";
import { getAll } from "@/services/species.service";
import Button from "@/components/ui/Button";

interface DataReportFormProps {
  /** 테스트용 스토어 주입. 생략 시 실제 localStorage. */
  deps?: ReportDeps;
  /** 종 목록 주입(테스트용). 기본은 species.json 전체. */
  speciesOptions?: { id: string; nameKorean: string }[];
  /** 신고 페이지 경로. 기본은 window.location.pathname. */
  page?: string;
}

/**
 * 데이터 오류 신고 폼(AppFooter에서 사용). 종 이름 자동완성 + 문제 유형 + 설명.
 * 종은 선택이라 비워 두면 "종과 무관한 신고"로 저장된다. 저장은 localStorage에만
 * 되며, /flags 페이지에서 JSON으로 묶어 넘긴다(서버 없음).
 */
export default function DataReportForm({
  deps,
  speciesOptions,
  page,
}: DataReportFormProps) {
  const uid = useId();
  const options = useMemo(
    () =>
      speciesOptions ??
      getAll().map((s) => ({ id: s.id, nameKorean: s.name_korean })),
    [speciesOptions]
  );
  const [speciesName, setSpeciesName] = useState("");
  const [category, setCategory] = useState<ReportCategory>("wrong-species");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "empty">("idle");

  const matched = useMemo(
    () => options.find((o) => o.nameKorean === speciesName.trim()),
    [options, speciesName]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const { added } = addReport(
      {
        speciesId: matched?.id ?? "",
        nameKorean: matched?.nameKorean ?? speciesName.trim(),
        category,
        detail,
        page:
          page ??
          (typeof window !== "undefined" ? window.location.pathname : ""),
      },
      deps
    );
    if (!added) {
      setStatus("empty");
      return;
    }
    setDetail("");
    setStatus("saved");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3"
      aria-label="데이터 오류 신고"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${uid}-species`} className="text-sm font-semibold text-gray-700">
          어떤 새인가요? <span className="font-normal text-gray-400">(선택)</span>
        </label>
        <input
          id={`${uid}-species`}
          list={`${uid}-species-list`}
          value={speciesName}
          onChange={(e) => setSpeciesName(e.target.value)}
          placeholder="예: 까치"
          autoComplete="off"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        />
        <datalist id={`${uid}-species-list`}>
          {options.map((o) => (
            <option key={o.id} value={o.nameKorean} />
          ))}
        </datalist>
        {speciesName.trim() !== "" && !matched && (
          <p className="text-xs text-gray-400">
            목록에 없는 이름이에요. 그대로 저장돼요.
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold text-gray-700">
          무엇이 문제인가요?
        </legend>
        {REPORT_CATEGORIES.map((c) => (
          <label key={c} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name={`${uid}-category`}
              value={c}
              checked={category === c}
              onChange={() => setCategory(c)}
              className="accent-leaf"
            />
            {REPORT_CATEGORY_LABEL[c]}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${uid}-detail`} className="text-sm font-semibold text-gray-700">
          자세히 알려주세요
        </label>
        <textarea
          id={`${uid}-detail`}
          value={detail}
          onChange={(e) => {
            setDetail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          rows={3}
          placeholder="예: 사진 속 새는 부리가 노란 걸 보니 까마귀가 아니라 큰부리까마귀 같아요"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm">
          신고 저장
        </Button>
        {status === "saved" && (
          <p role="status" className="text-sm text-leaf">
            저장됐어요. <a href="/flags" className="underline">신고 모아보기</a>에서
            JSON으로 보낼 수 있어요.
          </p>
        )}
        {status === "empty" && (
          <p role="alert" className="text-sm text-petal">
            설명을 한 줄이라도 적어 주세요.
          </p>
        )}
      </div>
    </form>
  );
}
