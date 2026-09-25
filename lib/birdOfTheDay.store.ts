import { isMoment, type Moment } from "@/lib/moment";

// ─── 오늘 만날 새 · 로컬 기록 (STORY-017) ─────────────────────────────────────
//
// 두 가지를 localStorage에 둔다. 둘 다 비필수라 손상 시 조용히 빈 값으로 복구한다.
// 1) 최근 오늘의 새 기록 {date, speciesId} — 30일 안에 나온 종을 다시 뽑지 않기 위해.
// 2) 순간별 열람 횟수 {dawn, day, dusk} — 어느 순간 문장을 먼저 잘 써야 하는지
//    판단하려는 계측. 서버 없이 이 기기 안에서만 센다.
// 진도(progress)와는 무관하다 — 홈은 개인화하지 않는다는 원칙(모두의 새).

export const BIRD_OF_THE_DAY_KEY = "learn-bird-names:bird-of-the-day";
export const MOMENT_VIEWS_KEY = "learn-bird-names:moment-views";

/** 다시 뽑지 않는 기간(일). */
export const RECENT_DAYS = 30;

export interface BirdOfTheDayRecord {
  date: string; // YYYY-MM-DD (로컬)
  speciesId: string;
}

export type MomentViews = Record<Moment, number>;

export interface BirdOfTheDayStore {
  loadRecords(): BirdOfTheDayRecord[];
  saveRecords(records: BirdOfTheDayRecord[]): void;
  loadViews(): MomentViews;
  saveViews(views: MomentViews): void;
  clear(): void;
}

export interface BirdOfTheDayDeps {
  store?: BirdOfTheDayStore;
  now?: Date;
}

const EMPTY_VIEWS: MomentViews = { dawn: 0, day: 0, dusk: 0 };

function isRecord(value: unknown): value is BirdOfTheDayRecord {
  if (value === null || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
    typeof r.speciesId === "string" &&
    r.speciesId.length > 0
  );
}

function parseRecords(raw: string | null): BirdOfTheDayRecord[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
}

function parseViews(raw: string | null): MomentViews {
  if (raw === null) return { ...EMPTY_VIEWS };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return { ...EMPTY_VIEWS };
    const r = parsed as Record<string, unknown>;
    const views = { ...EMPTY_VIEWS };
    for (const key of Object.keys(views) as Moment[]) {
      const v = r[key];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) views[key] = v;
    }
    return views;
  } catch {
    return { ...EMPTY_VIEWS };
  }
}

function defaultStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage를 사용할 수 없습니다.");
  }
  return window.localStorage;
}

export function createBirdOfTheDayStore(
  storage: Storage = defaultStorage()
): BirdOfTheDayStore {
  return {
    loadRecords: () => parseRecords(storage.getItem(BIRD_OF_THE_DAY_KEY)),
    saveRecords: (records) =>
      storage.setItem(BIRD_OF_THE_DAY_KEY, JSON.stringify(records)),
    loadViews: () => parseViews(storage.getItem(MOMENT_VIEWS_KEY)),
    saveViews: (views) => storage.setItem(MOMENT_VIEWS_KEY, JSON.stringify(views)),
    clear() {
      storage.removeItem(BIRD_OF_THE_DAY_KEY);
      storage.removeItem(MOMENT_VIEWS_KEY);
    },
  };
}

/** 저장소를 못 쓰는 환경(SSR·차단)용 메모리 대체. 세션 동안만 산다. */
export function createMemoryBirdOfTheDayStore(): BirdOfTheDayStore {
  let records: BirdOfTheDayRecord[] = [];
  let views: MomentViews = { ...EMPTY_VIEWS };
  return {
    loadRecords: () => records,
    saveRecords: (r) => {
      records = r;
    },
    loadViews: () => views,
    saveViews: (v) => {
      views = v;
    },
    clear() {
      records = [];
      views = { ...EMPTY_VIEWS };
    },
  };
}

function resolve(deps?: BirdOfTheDayDeps): { store: BirdOfTheDayStore; now: Date } {
  let store = deps?.store;
  if (!store) {
    try {
      store = createBirdOfTheDayStore();
    } catch {
      store = createMemoryBirdOfTheDayStore();
    }
  }
  return { store, now: deps?.now ?? new Date() };
}

/** 로컬 날짜 키 YYYY-MM-DD. (toISOString은 UTC라 자정 근처에 날짜가 밀리므로 쓰지 않는다.) */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 오늘 이미 기록된 종 id. 없으면 undefined. */
export function getTodayRecord(deps?: BirdOfTheDayDeps): BirdOfTheDayRecord | undefined {
  const { store, now } = resolve(deps);
  const today = localDateKey(now);
  return store.loadRecords().find((r) => r.date === today);
}

/** 최근 RECENT_DAYS일(오늘 제외) 안에 오늘의 새였던 종 id 목록. */
export function getRecentSpeciesIds(deps?: BirdOfTheDayDeps): string[] {
  const { store, now } = resolve(deps);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
  const cutoffKey = localDateKey(cutoff);
  const today = localDateKey(now);
  return store
    .loadRecords()
    .filter((r) => r.date >= cutoffKey && r.date !== today)
    .map((r) => r.speciesId);
}

/** 오늘의 새를 기록한다(같은 날 중복 없음). RECENT_DAYS보다 오래된 기록은 정리. */
export function recordBirdOfTheDay(speciesId: string, deps?: BirdOfTheDayDeps): void {
  const { store, now } = resolve(deps);
  const today = localDateKey(now);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
  const cutoffKey = localDateKey(cutoff);
  const kept = store
    .loadRecords()
    .filter((r) => r.date >= cutoffKey && r.date !== today);
  store.saveRecords([...kept, { date: today, speciesId }]);
}

/** 순간별 열람 1 증가. */
export function countMomentView(moment: Moment, deps?: BirdOfTheDayDeps): MomentViews {
  const { store } = resolve(deps);
  if (!isMoment(moment)) return store.loadViews();
  const views = store.loadViews();
  views[moment] += 1;
  store.saveViews(views);
  return views;
}

export function getMomentViews(deps?: BirdOfTheDayDeps): MomentViews {
  return resolve(deps).store.loadViews();
}

export function clearBirdOfTheDay(deps?: BirdOfTheDayDeps): void {
  resolve(deps).store.clear();
}
