import type { SRSQuality, SpeciesProgress, UserProgress } from "@/types";

// ─── LocalStorageAdapter · 진도 직렬화 (STORY-008 / NFR-003) ──────────────────
//
// UserProgress를 단일 키에 JSON으로 저장한다. 파싱·스키마 검증 실패는
// ProgressCorruptedError로 올려 상위 UI가 초기화 안내를 띄울 수 있게 한다.
// Storage를 주입하면 테스트에서 localStorage 없이 결정론적으로 검증한다.

export const PROGRESS_STORAGE_KEY = "learn-bird-names:progress";

export class ProgressCorruptedError extends Error {
  constructor(cause?: unknown) {
    super("학습 진도 데이터가 손상되었습니다. 초기화해 주세요.");
    this.name = "ProgressCorruptedError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export interface ProgressStore {
  load(): UserProgress;
  save(progress: UserProgress): void;
  clear(): void;
}

const QUALITIES = new Set<SRSQuality>([0, 1, 2, 3, 4, 5]);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isSpeciesProgress(value: unknown): value is SpeciesProgress {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const rec = value as Record<string, unknown>;
  return (
    isFiniteNumber(rec.correct_count) &&
    rec.correct_count >= 0 &&
    isFiniteNumber(rec.incorrect_count) &&
    rec.incorrect_count >= 0 &&
    isNonEmptyString(rec.last_seen) &&
    isNonEmptyString(rec.next_review) &&
    isFiniteNumber(rec.easiness_factor) &&
    isFiniteNumber(rec.interval_days) &&
    QUALITIES.has(rec.last_quality as SRSQuality)
  );
}

function isUserProgress(value: unknown): value is UserProgress {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.entries(value as Record<string, unknown>).every(
    ([id, progress]) => id.length > 0 && isSpeciesProgress(progress)
  );
}

function parseProgress(raw: string | null): UserProgress {
  if (raw === null) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new ProgressCorruptedError(cause);
  }
  if (!isUserProgress(parsed)) {
    throw new ProgressCorruptedError();
  }
  return parsed;
}

function defaultStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage를 사용할 수 없습니다.");
  }
  return window.localStorage;
}

/** 테스트용 in-memory Storage. 브라우저 Storage 인터페이스만 구현한다. */
export function createFakeStorage(
  initial: Record<string, string> = {}
): Storage {
  const map: Record<string, string> = { ...initial };
  return {
    get length() {
      return Object.keys(map).length;
    },
    key(index: number) {
      return Object.keys(map)[index] ?? null;
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
    },
    setItem(key: string, value: string) {
      map[key] = String(value);
    },
    removeItem(key: string) {
      delete map[key];
    },
    clear() {
      for (const key of Object.keys(map)) delete map[key];
    },
  };
}

export function createLocalStorageAdapter(
  storage: Storage = defaultStorage()
): ProgressStore {
  return {
    load() {
      return parseProgress(storage.getItem(PROGRESS_STORAGE_KEY));
    },
    save(progress) {
      storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    },
    clear() {
      storage.removeItem(PROGRESS_STORAGE_KEY);
    },
  };
}
