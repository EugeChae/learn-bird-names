import type {
  Species,
  SpeciesProgress,
  SRSQuality,
  UserProgress,
  LearnerLevel,
  DifficultyTier,
} from "@/types";
import {
  calculate,
  DEFAULT_EASINESS_FACTOR,
} from "@/services/srs.engine";
import {
  createLocalStorageAdapter,
  type ProgressStore,
} from "@/lib/localStorage.adapter";
import {
  createLearnerLevelStore,
  createMemoryLearnerLevelStore,
  type LearnerLevelStore,
} from "@/lib/learnerLevel.store";
import {
  getById as getSpeciesById,
  getAll as getAllSpecies,
} from "@/services/species.service";

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
  /** 전체 카탈로그(대시보드 "전체 종 수"용). 기본: species.service.getAll. */
  getAll?: () => Species[];
  /** 도달한 최고 레벨 저장소. 기본: localStorage(불가 환경이면 메모리). */
  levelStore?: LearnerLevelStore;
}

/** 마스터 기준: 연속 정답 횟수(STORY-015 / PRD FR-017). */
export const MASTERY_THRESHOLD = 3;

/** 대시보드 취약종 목록 최대 개수. */
export const WEAK_LIMIT = 10;

function storeOf(deps: ProgressDeps): ProgressStore {
  return deps.store ?? createLocalStorageAdapter();
}

function levelStoreOf(deps: ProgressDeps): LearnerLevelStore {
  if (deps.levelStore) return deps.levelStore;
  try {
    return createLearnerLevelStore();
  } catch {
    return createMemoryLearnerLevelStore();
  }
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
    consecutive_correct: 0,
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
    // 정답(q>0)이면 연속 +1, 오답(q=0)이면 0으로 리셋.
    consecutive_correct:
      quality === 0 ? 0 : (prev.consecutive_correct ?? 0) + 1,
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

/** 취약종 한 항목: 종 + 오답 비율/횟수/시도수. */
export interface WeakEntry {
  species: Species;
  missRate: number; // 0~1
  incorrect: number;
  attempts: number;
}

/**
 * 시도 기록이 있는 종을 오답 비율 높은 순(같으면 오답 횟수 많은 순)으로 스코어링.
 * getWeakSpecies·getProgressSummary가 공유한다(단일 진실).
 */
function scoreWeak(all: UserProgress, deps: ProgressDeps): WeakEntry[] {
  const scored: WeakEntry[] = [];
  for (const [id, progress] of Object.entries(all)) {
    const attempts = progress.correct_count + progress.incorrect_count;
    if (attempts === 0) continue;
    const species = lookup(id, deps);
    if (!species) continue;
    scored.push({
      species,
      missRate: progress.incorrect_count / attempts,
      incorrect: progress.incorrect_count,
      attempts,
    });
  }
  scored.sort((a, b) => b.missRate - a.missRate || b.incorrect - a.incorrect);
  return scored;
}

/**
 * 오답 비율이 높은 종부터 limit개. 비율이 같으면 오답 횟수가 많은 순.
 * 시도 기록이 있는 종만 대상이다.
 */
export function getWeakSpecies(
  limit: number,
  deps: ProgressDeps = {}
): Species[] {
  return scoreWeak(storeOf(deps).load(), deps)
    .slice(0, Math.max(0, limit))
    .map((row) => row.species);
}

/** 진도 대시보드 요약(STORY-015). 한 번의 로드로 카운트 + 취약목록을 계산. */
export interface ProgressSummary {
  /** 시도 기록이 있는(학습한) 종 수. */
  learned: number;
  /** 전체 카탈로그 종 수. */
  total: number;
  /** 연속 MASTERY_THRESHOLD회 이상 정답한 종 수. */
  mastered: number;
  /** 오답 비율 높은 순 최대 WEAK_LIMIT개. */
  weak: WeakEntry[];
  /** 오답 보기 난이도 레벨과 그 근거(대시보드 표시용). */
  level: LearnerLevelInfo;
}

export function getProgressSummary(deps: ProgressDeps = {}): ProgressSummary {
  const all = storeOf(deps).load();
  const entries = Object.values(all);
  const mastered = entries.filter(
    (p) => (p.consecutive_correct ?? 0) >= MASTERY_THRESHOLD
  ).length;
  const total = (deps.getAll ?? getAllSpecies)().length;
  return {
    learned: entries.length,
    total,
    mastered,
    weak: scoreWeak(all, deps).slice(0, WEAK_LIMIT),
    level: getLearnerLevel(deps),
  };
}

// ─── 학습자 레벨 (오답 보기 거리, 2026-09-20) ──────────────────────────────────
//
// 3단계 절대평가. 친숙도 tier별 숙지율로 자동 승급하고 한 번 오르면 내려가지 않는다.
//   Lv1 입문 → Lv2: tier 1 새의 LEVEL_UP_RATIO 이상 숙지
//   Lv2      → Lv3: tier 2 새의 LEVEL_UP_RATIO 이상 숙지
// 승급 조건이 대시보드에 그대로 보여야 한다(블랙박스 금지). 수동 고정은 두지 않는다.
// 사용자가 확보되면 상대평가로 전환 검토(docs/difficulty-tiers-2026-09-20.md).

export const LEVEL_UP_RATIO = 0.7;

export interface TierMastery {
  tier: DifficultyTier;
  mastered: number;
  total: number;
  /** 다음 레벨로 가기 위해 이 tier에서 숙지해야 하는 종 수(올림). */
  required: number;
}

export interface LearnerLevelInfo {
  level: LearnerLevel;
  /** 진도만으로 계산한 레벨(저장된 최고치와 다를 수 있음). */
  computed: LearnerLevel;
  /** tier 1·2 숙지 현황(승급 근거). */
  tiers: [TierMastery, TierMastery];
  /** 다음 레벨 조건. 최고 레벨이면 null. */
  next: { level: LearnerLevel; tier: DifficultyTier; remaining: number } | null;
}

function tierMastery(
  tier: DifficultyTier,
  species: Species[],
  progress: UserProgress
): TierMastery {
  const inTier = species.filter((s) => s.difficulty_tier === tier);
  const mastered = inTier.filter(
    (s) => (progress[s.id]?.consecutive_correct ?? 0) >= MASTERY_THRESHOLD
  ).length;
  return {
    tier,
    mastered,
    total: inTier.length,
    required: Math.ceil(inTier.length * LEVEL_UP_RATIO),
  };
}

/**
 * 학습자 레벨. 진도로 계산한 값과 저장된 최고 레벨 중 큰 쪽을 쓰고,
 * 올랐으면 저장한다(단조 증가).
 */
export function getLearnerLevel(deps: ProgressDeps = {}): LearnerLevelInfo {
  const progress = storeOf(deps).load();
  const species = (deps.getAll ?? getAllSpecies)();
  const t1 = tierMastery(1, species, progress);
  const t2 = tierMastery(2, species, progress);

  let computed: LearnerLevel = 1;
  if (t1.total > 0 && t1.mastered >= t1.required) computed = 2;
  if (computed === 2 && t2.total > 0 && t2.mastered >= t2.required) computed = 3;

  const levelStore = levelStoreOf(deps);
  const saved = levelStore.load();
  let level: LearnerLevel = saved ? saved.level : 1;
  if (computed > level) {
    level = computed;
    levelStore.save({ level, reached_at: nowOf(deps).toISOString() });
  }

  let next: LearnerLevelInfo["next"] = null;
  if (level === 1) {
    next = { level: 2, tier: 1, remaining: Math.max(0, t1.required - t1.mastered) };
  } else if (level === 2) {
    next = { level: 3, tier: 2, remaining: Math.max(0, t2.required - t2.mastered) };
  }

  return { level, computed, tiers: [t1, t2], next };
}

/** Taxonomy 모드 잠금 해제 기준: 누적 정답 종 수(STORY-014 / FR-015). */
export const TAXONOMY_UNLOCK_THRESHOLD = 20;

/** 한 번이라도 정답을 맞힌 서로 다른 종의 수(correct_count > 0). */
export function countCorrectSpecies(deps: ProgressDeps = {}): number {
  let n = 0;
  for (const p of Object.values(storeOf(deps).load())) {
    if (p.correct_count > 0) n += 1;
  }
  return n;
}

/** Taxonomy 모드 잠금 해제 여부(누적 정답 ≥ THRESHOLD). */
export function isTaxonomyUnlocked(deps: ProgressDeps = {}): boolean {
  return countCorrectSpecies(deps) >= TAXONOMY_UNLOCK_THRESHOLD;
}

/** 저장된 진도와 도달 레벨을 모두 지운다. */
export function resetAll(deps: ProgressDeps = {}): void {
  storeOf(deps).clear();
  levelStoreOf(deps).clear();
}
