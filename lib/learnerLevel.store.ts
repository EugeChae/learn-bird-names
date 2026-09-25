import type { LearnerLevel } from "@/types";

// ─── LearnerLevel · 도달한 최고 레벨 저장 ─────────────────────────────────────
//
// 레벨은 진도(숙지율)에서 계산되지만, 숙지 판정(연속 정답 3회)이 오답 한 번에
// 리셋되는 구조라 매번 실시간으로 계산하면 경계선에서 레벨이 오르내린다.
// 그래서 "한 번 도달한 레벨은 내려가지 않는다"를 여기서 보장한다(단조 증가).
// 진도 초기화 시 함께 지운다. 비필수 데이터라 손상 시 조용히 1로 복구한다.

export const LEARNER_LEVEL_STORAGE_KEY = "learn-bird-names:learner-level";

export interface LearnerLevelRecord {
  level: LearnerLevel;
  reached_at: string; // ISO 8601
}

export interface LearnerLevelStore {
  load(): LearnerLevelRecord | null;
  save(record: LearnerLevelRecord): void;
  clear(): void;
}

function isLevel(value: unknown): value is LearnerLevel {
  return value === 1 || value === 2 || value === 3;
}

function parseRecord(raw: string | null): LearnerLevelRecord | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return null;
    const r = parsed as Record<string, unknown>;
    if (!isLevel(r.level) || typeof r.reached_at !== "string") return null;
    return { level: r.level, reached_at: r.reached_at };
  } catch {
    return null;
  }
}

function defaultStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage를 사용할 수 없습니다.");
  }
  return window.localStorage;
}

export function createLearnerLevelStore(
  storage: Storage = defaultStorage()
): LearnerLevelStore {
  return {
    load() {
      return parseRecord(storage.getItem(LEARNER_LEVEL_STORAGE_KEY));
    },
    save(record) {
      storage.setItem(LEARNER_LEVEL_STORAGE_KEY, JSON.stringify(record));
    },
    clear() {
      storage.removeItem(LEARNER_LEVEL_STORAGE_KEY);
    },
  };
}

/** 저장소를 못 쓰는 환경(SSR·차단)에서도 동작하도록 메모리 저장소로 대체한다. */
export function createMemoryLearnerLevelStore(): LearnerLevelStore {
  let record: LearnerLevelRecord | null = null;
  return {
    load: () => record,
    save: (r) => {
      record = r;
    },
    clear: () => {
      record = null;
    },
  };
}
