import { createFakeStorage } from "@/lib/localStorage.adapter";

// ─── PhotoFlags · 사진 변경요청 저장 ──────────────────────────────────────────
//
// 사용자가 퀴즈를 풀다 "이 사진 별로다" 싶을 때 원탭으로 표시하는 플래그를
// localStorage에 모은다. 나중에 /flags 페이지에서 모아 보고 배치로 사진을 교체한다.
// 진도(progress)와 달리 비필수 데이터이므로, 손상 시 예외를 던지지 않고
// 조용히 빈 배열로 복구한다(플래그가 깨졌다고 학습을 막을 이유는 없다).

export const PHOTO_FLAGS_STORAGE_KEY = "learn-bird-names:photo-flags";

export interface PhotoFlag {
  speciesId: string;
  nameKorean: string;
  photoUrl: string;
  flaggedAt: string; // ISO 8601
}

/** 플래그 대상 사진을 식별하는 최소 정보(flaggedAt은 저장 시 채워짐). */
export type PhotoFlagInput = Omit<PhotoFlag, "flaggedAt">;

export interface FlagStore {
  load(): PhotoFlag[];
  save(flags: PhotoFlag[]): void;
  clear(): void;
}

export interface FlagDeps {
  store?: FlagStore;
  now?: Date;
}

// createFakeStorage는 여기서 직접 쓰지 않지만, 테스트가 이 모듈을 통해
// 함께 임포트할 수 있도록 재노출한다.
export { createFakeStorage };

function isPhotoFlag(value: unknown): value is PhotoFlag {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const r = value as Record<string, unknown>;
  return (
    typeof r.speciesId === "string" &&
    r.speciesId.length > 0 &&
    typeof r.nameKorean === "string" &&
    typeof r.photoUrl === "string" &&
    r.photoUrl.length > 0 &&
    typeof r.flaggedAt === "string" &&
    r.flaggedAt.length > 0
  );
}

function parseFlags(raw: string | null): PhotoFlag[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPhotoFlag);
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

export function createFlagStore(storage: Storage = defaultStorage()): FlagStore {
  return {
    load() {
      return parseFlags(storage.getItem(PHOTO_FLAGS_STORAGE_KEY));
    },
    save(flags) {
      storage.setItem(PHOTO_FLAGS_STORAGE_KEY, JSON.stringify(flags));
    },
    clear() {
      storage.removeItem(PHOTO_FLAGS_STORAGE_KEY);
    },
  };
}

function resolve(deps?: FlagDeps): { store: FlagStore; now: Date } {
  return {
    store: deps?.store ?? createFlagStore(),
    now: deps?.now ?? new Date(),
  };
}

export function getFlags(deps?: FlagDeps): PhotoFlag[] {
  return resolve(deps).store.load();
}

export function isFlagged(photoUrl: string, deps?: FlagDeps): boolean {
  return getFlags(deps).some((f) => f.photoUrl === photoUrl);
}

export function flagPhoto(input: PhotoFlagInput, deps?: FlagDeps): PhotoFlag[] {
  const { store, now } = resolve(deps);
  const flags = store.load();
  if (flags.some((f) => f.photoUrl === input.photoUrl)) return flags;
  const next = [...flags, { ...input, flaggedAt: now.toISOString() }];
  store.save(next);
  return next;
}

export function unflagPhoto(photoUrl: string, deps?: FlagDeps): PhotoFlag[] {
  const { store } = resolve(deps);
  const next = store.load().filter((f) => f.photoUrl !== photoUrl);
  store.save(next);
  return next;
}

/** 있으면 끄고 없으면 켠다. flagged=적용 후 상태. */
export function toggleFlag(
  input: PhotoFlagInput,
  deps?: FlagDeps
): { flags: PhotoFlag[]; flagged: boolean } {
  const exists = isFlagged(input.photoUrl, deps);
  const flags = exists
    ? unflagPhoto(input.photoUrl, deps)
    : flagPhoto(input, deps);
  return { flags, flagged: !exists };
}

export function clearFlags(deps?: FlagDeps): void {
  resolve(deps).store.clear();
}
