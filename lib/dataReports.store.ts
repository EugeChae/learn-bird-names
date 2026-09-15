// ─── DataReports · 데이터 오류 신고 저장 ───────────────────────────────────────
//
// 사진 플래그(photoFlags.store)가 "이 사진 별로예요" 원탭이라면, 여기는 데이터셋 자체의
// 문제를 제기하는 통로다: 사진 속 새가 다른 종이다, 이름·학명이 틀렸다, 분류·서식지·
// 철새 구분·트리비아가 잘못됐다 등. 앱 최하단(AppFooter)의 폼에서 작성해 localStorage에
// 모으고, /flags 페이지에서 JSON으로 묶어 큐레이터에게 넘긴다.
// 비필수 데이터라 손상 시 예외 없이 빈 배열로 복구한다(photoFlags와 같은 정책).

export const DATA_REPORTS_STORAGE_KEY = "learn-bird-names:data-reports";

export type ReportCategory =
  | "wrong-species" // 사진 속 새가 이 종이 아님(오동정)
  | "wrong-photo" // 사진 품질·구도 문제(얼빡샷, 다른 새 혼입 등)
  | "wrong-name" // 한국명·학명·영명 오류
  | "wrong-info" // 분류(목/과)·서식지·철새 구분·흔함 정도·트리비아 오류
  | "other";

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  "wrong-species": "사진 속 새가 다른 종이에요",
  "wrong-photo": "사진이 부적절해요(품질·구도·다른 새 혼입)",
  "wrong-name": "이름·학명이 틀렸어요",
  "wrong-info": "분류·서식지·철새 구분·설명이 틀렸어요",
  other: "기타",
};

export const REPORT_CATEGORIES = Object.keys(
  REPORT_CATEGORY_LABEL
) as ReportCategory[];

export interface DataReport {
  id: string;
  /** 대상 종 id. 특정 종과 무관한 신고면 빈 문자열. */
  speciesId: string;
  nameKorean: string;
  category: ReportCategory;
  detail: string;
  /** 신고 당시 보고 있던 페이지 경로(문맥 파악용). */
  page: string;
  reportedAt: string; // ISO 8601
}

export type DataReportInput = Omit<DataReport, "id" | "reportedAt">;

export interface ReportStore {
  load(): DataReport[];
  save(reports: DataReport[]): void;
  clear(): void;
}

export interface ReportDeps {
  store?: ReportStore;
  now?: Date;
  /** id 생성기(테스트 결정론용). 기본은 시각+난수. */
  makeId?: () => string;
}

function isCategory(value: unknown): value is ReportCategory {
  return typeof value === "string" && value in REPORT_CATEGORY_LABEL;
}

function isDataReport(value: unknown): value is DataReport {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.speciesId === "string" &&
    typeof r.nameKorean === "string" &&
    isCategory(r.category) &&
    typeof r.detail === "string" &&
    typeof r.page === "string" &&
    typeof r.reportedAt === "string" &&
    r.reportedAt.length > 0
  );
}

function parseReports(raw: string | null): DataReport[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDataReport);
  } catch {
    return [];
  }
}

function defaultStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage를 사용할 수 없습니다.");
  }
  return window.localStorage;
}

export function createReportStore(
  storage: Storage = defaultStorage()
): ReportStore {
  return {
    load() {
      return parseReports(storage.getItem(DATA_REPORTS_STORAGE_KEY));
    },
    save(reports) {
      storage.setItem(DATA_REPORTS_STORAGE_KEY, JSON.stringify(reports));
    },
    clear() {
      storage.removeItem(DATA_REPORTS_STORAGE_KEY);
    },
  };
}

function defaultId(now: Date): string {
  return `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolve(deps?: ReportDeps): {
  store: ReportStore;
  now: Date;
  makeId: () => string;
} {
  const now = deps?.now ?? new Date();
  return {
    store: deps?.store ?? createReportStore(),
    now,
    makeId: deps?.makeId ?? (() => defaultId(now)),
  };
}

export function getReports(deps?: ReportDeps): DataReport[] {
  return resolve(deps).store.load();
}

/**
 * 신고를 추가한다. detail이 공백뿐이면 저장하지 않고 현재 목록을 그대로 돌려준다
 * (빈 신고는 큐레이터에게 아무 정보도 주지 못한다).
 */
export function addReport(
  input: DataReportInput,
  deps?: ReportDeps
): { reports: DataReport[]; added: DataReport | null } {
  const { store, now, makeId } = resolve(deps);
  const reports = store.load();
  const detail = input.detail.trim();
  if (detail === "") return { reports, added: null };
  const added: DataReport = {
    ...input,
    detail,
    id: makeId(),
    reportedAt: now.toISOString(),
  };
  const next = [...reports, added];
  store.save(next);
  return { reports: next, added };
}

export function removeReport(id: string, deps?: ReportDeps): DataReport[] {
  const { store } = resolve(deps);
  const next = store.load().filter((r) => r.id !== id);
  store.save(next);
  return next;
}

export function clearReports(deps?: ReportDeps): void {
  resolve(deps).store.clear();
}
