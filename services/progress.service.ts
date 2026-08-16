import type { Species, SpeciesProgress, SRSQuality, UserProgress } from "@/types";
import {
  calculate,
  DEFAULT_EASINESS_FACTOR,
} from "@/services/srs.engine";
import {
  createLocalStorageAdapter,
  type ProgressStore,
} from "@/lib/localStorage.adapter";
import { getById as getSpeciesById } from "@/services/species.service";

// ─── ProgressService · 학습 진도 (STORY-008) ──────────────────────────────────
//
// LocalStorageAdapter 위에 SRS 상태를 쌓는다. updateProgress는 반드시
// SRSEngine.calculate()로 next_review / EF / interval을 갱신한다.
// store·now·종 조회를 주입하면 테스트가 결정론적이고, Phase 2에서
// fetch('/api/users/:id/progress')로 어댑터만 갈아끼울 수 있다.

export { ProgressCorruptedError } from "@/lib/localStorage.adapter";

export interface ProgressDeps {
  store?: ProgressStore;
  now?: Date;
  getById?: (id: string) => Species | undefined;
}

function storeOf(deps: ProgressDeps): ProgressStore {
  return deps.store ?? createLocalStorageAdapter();
}

function nowOf(deps: ProgressDeps): Date {
  return deps.now ?? new Date();
}

function lookup(id: string, deps: ProgressDeps): Species | undefined {
  return (deps.getById ?? getSpeciesById)(id);
}

function freshProgress(now: Date): SpeciesProgress {
  return {
    correct_count: 0,
    incorrect_count: 0,
    last_seen: now.toISOString(),
    next_review: now.toISOString(),
    easiness_factor: DEFAULT_EASINESS_FACTOR,
    interval_days: 0,
    last_quality: 0,
  };
}

function cloneProgress(progress: UserProgress): UserProgress {
  const copy: UserProgress = {};
  for (const [id, value] of Object.entries(progress)) {
    copy[id] = { ...value };
  }
  return copy;
}

/** 한 종의 진도. 기록이 없으면 null. */
export function getProgress(
  speciesId: string,
  deps: ProgressDeps = {}
): SpeciesProgress | null {
  const saved = storeOf(deps).load()[speciesId];
  return saved ? { ...saved } : null;
}

/** 전체 진도. 호출자가 변이해도 저장본은 바뀌지 않는다. */
export function getAllProgress(deps: ProgressDeps = {}): UserProgress {
  return cloneProgress(storeOf(deps).load());
}

/**
 * 응답 품질로 한 종의 진도를 갱신하고 저장한다.
 * 새 종은 EF 2.5 / interval 0에서 시작한다.
 */
export function updateProgress(
  speciesId: string,
  quality: SRSQuality,
  deps: ProgressDeps = {}
): void {
  const now = nowOf(deps);
  const store = storeOf(deps);
  const all = store.load();
  const prev = all[speciesId] ?? freshProgress(now);
  const srs = calculate(prev, quality, now);

  all[speciesId] = {
    ...prev,
    ...srs,
    last_seen: now.toISOString(),
    last_quality: quality,
    correct_count: prev.correct_count + (quality === 0 ? 0 : 1),
    incorrect_count: prev.incorrect_count + (quality === 0 ? 1 : 0),
  };

  store.save(all);
}

/** next_review가 지금 이하인 종. 카탈로그에 없는 id는 건너뛴다. */
export function getDueForReview(deps: ProgressDeps = {}): Species[] {
  const now = nowOf(deps).getTime();
  const due: Species[] = [];
  for (const [id, progress] of Object.entries(storeOf(deps).load())) {
    if (new Date(progress.next_review).getTime() > now) continue;
    const species = lookup(id, deps);
    if (species) due.push(species);
  }
  return due;
}

/**
 * 오답 비율이 높은 종부터 limit개. 비율이 같으면 오답 횟수가 많은 순.
 * 시도 기록이 있는 종만 대상이다.
 */
export function getWeakSpecies(
  limit: number,
  deps: ProgressDeps = {}
): Species[] {
  const scored: { species: Species; rate: number; incorrect: number }[] = [];

  for (const [id, progress] of Object.entries(storeOf(deps).load())) {
    const attempts = progress.correct_count + progress.incorrect_count;
    if (attempts === 0) continue;
    const species = lookup(id, deps);
    if (!species) continue;
    scored.push({
      species,
      rate: progress.incorrect_count / attempts,
      incorrect: progress.incorrect_count,
    });
  }

  scored.sort((a, b) => b.rate - a.rate || b.incorrect - a.incorrect);
  return scored.slice(0, Math.max(0, limit)).map((row) => row.species);
}

/** 저장된 진도를 모두 지운다. */
export function resetAll(deps: ProgressDeps = {}): void {
  storeOf(deps).clear();
}
