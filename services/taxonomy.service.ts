import type {
  Species,
  TaxonomyChoice,
  TaxonomyQuestion,
  TaxonomyQuestionType,
  TaxonomySession,
  TaxonomyAnswerResult,
} from "@/types";
import { getAll } from "@/services/species.service";
import { taxonKo, familyKo } from "@/lib/taxonomy-labels";

// ─── TaxonomyService · 분류 퀴즈 코어 (STORY-014 / FR-015) ─────────────────────
//
// 개별 종 퀴즈(quiz.service)와 별개 모드. 3가지 유형을 한 세션에 고르게 섞어 낸다:
//   유형1 photo-to-taxon   — 사진 보고 목(目)/과(科) 4지선다
//   유형2 odd-one-out       — 같은 과 3 + 다른 과 1 중 이상한 종
//   유형3 family-membership — 과 이름 제시 → 소속/비소속 종 고르기
//
// 종 SRS(progress.service)는 건드리지 않는다(분류 관계 학습은 별개 스킬).
// rng·pool 주입으로 결정론적 테스트. 재시도/스트릭 규칙은 quiz.service와 동일하게 맞춘다.

export const TAXONOMY_SESSION_SIZE = 9;
const CHOICES = 4;
const TYPES: TaxonomyQuestionType[] = [
  "photo-to-taxon",
  "odd-one-out",
  "family-membership",
];

export interface TaxonomyDeps {
  rng?: () => number;
  pool?: Species[];
  size?: number;
}

/** Fisher-Yates 셔플(rng 주입 결정론). 원본 불변. */
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** pool을 셔플해 앞에서 n개(부족하면 있는 만큼). */
function sample<T>(items: readonly T[], n: number, rng: () => number): T[] {
  return shuffle(items, rng).slice(0, n);
}

function makeId(rng: () => number): string {
  return "taxq-" + Math.floor(rng() * 0xffffffff).toString(36);
}

function speciesChoice(s: Species): TaxonomyChoice {
  return { id: s.id, label: s.name_korean, species: s };
}

/** 과(科)별 종 목록. */
function groupByFamily(pool: Species[]): Map<string, Species[]> {
  const m = new Map<string, Species[]>();
  for (const s of pool) {
    const arr = m.get(s.family);
    if (arr) arr.push(s);
    else m.set(s.family, [s]);
  }
  return m;
}

/** 유형1: 사진 보고 목/과 맞히기. 같은 레벨의 다른 taxon 3개를 오답으로. */
function buildPhotoToTaxon(
  pool: Species[],
  rng: () => number
): TaxonomyQuestion | null {
  const target = sample(pool, 1, rng)[0];
  if (!target) return null;

  // order/family 중 오답 taxon이 3개 이상 나오는 레벨을 고른다(가능하면 랜덤).
  const levels: ("order" | "family")[] = rng() < 0.5 ? ["order", "family"] : ["family", "order"];
  for (const level of levels) {
    const correctLatin = target[level];
    const otherLatin = Array.from(
      new Set(pool.map((s) => s[level]).filter((t) => t !== correctLatin))
    );
    if (otherLatin.length < CHOICES - 1) continue;
    const decoyLatin = sample(otherLatin, CHOICES - 1, rng);
    const choices = shuffle(
      [correctLatin, ...decoyLatin].map((latin) => ({
        id: latin,
        label: taxonKo(level, latin),
      })),
      rng
    );
    return {
      id: makeId(rng),
      type: "photo-to-taxon",
      promptSpecies: target,
      taxonLevel: level,
      choices,
      correctId: correctLatin,
      usedHint: false,
      attemptCount: 0,
    };
  }
  return null;
}

/** 유형2: 같은 과 3 + 다른 과 1. 정답 = 이상한(다른 과) 종. */
function buildOddOneOut(
  pool: Species[],
  rng: () => number
): TaxonomyQuestion | null {
  const families = groupByFamily(pool);
  const bigFamilies = Array.from(families.entries()).filter(
    ([, arr]) => arr.length >= CHOICES - 1
  );
  if (bigFamilies.length === 0) return null;

  const [fam, members] = sample(bigFamilies, 1, rng)[0];
  const sameFam = sample(members, CHOICES - 1, rng);
  const others = pool.filter((s) => s.family !== fam);
  const odd = sample(others, 1, rng)[0];
  if (!odd || sameFam.length < CHOICES - 1) return null;

  const choices = shuffle([...sameFam, odd].map(speciesChoice), rng);
  return {
    id: makeId(rng),
    type: "odd-one-out",
    choices,
    correctId: odd.id,
    usedHint: false,
    attemptCount: 0,
  };
}

/** 유형3: 과 이름 제시 → 소속/비소속 종 고르기. */
function buildFamilyMembership(
  pool: Species[],
  rng: () => number
): TaxonomyQuestion | null {
  const families = groupByFamily(pool);
  const famList = Array.from(families.entries());
  if (famList.length < 2) return null;

  const [fam, members] = sample(famList, 1, rng)[0];
  const outsiders = pool.filter((s) => s.family !== fam);
  if (outsiders.length < CHOICES - 1) return null;

  // 과 종이 3개 이상이면 "비소속 고르기"도 가능 — 랜덤. 아니면 "소속 고르기".
  const askBelongs = members.length >= CHOICES - 1 ? rng() < 0.5 : true;

  let picks: Species[];
  let correct: Species;
  if (askBelongs) {
    correct = sample(members, 1, rng)[0];
    picks = [correct, ...sample(outsiders, CHOICES - 1, rng)];
  } else {
    correct = sample(outsiders, 1, rng)[0];
    picks = [correct, ...sample(members, CHOICES - 1, rng)];
  }
  if (!correct || picks.length < CHOICES) return null;

  return {
    id: makeId(rng),
    type: "family-membership",
    familyLabel: familyKo(fam),
    askBelongs,
    choices: shuffle(picks.map(speciesChoice), rng),
    correctId: correct.id,
    usedHint: false,
    attemptCount: 0,
  };
}

const BUILDERS: Record<
  TaxonomyQuestionType,
  (pool: Species[], rng: () => number) => TaxonomyQuestion | null
> = {
  "photo-to-taxon": buildPhotoToTaxon,
  "odd-one-out": buildOddOneOut,
  "family-membership": buildFamilyMembership,
};

/**
 * 3가지 유형을 라운드로빈으로 고르게 섞어 size개 문제를 만든다.
 * 특정 유형이 데이터 부족으로 못 만들어지면 건너뛰고 다음 유형으로 채운다.
 */
export function createTaxonomySession(deps: TaxonomyDeps = {}): TaxonomySession {
  const rng = deps.rng ?? Math.random;
  const pool = deps.pool ?? getAll();
  const size = deps.size ?? TAXONOMY_SESSION_SIZE;

  const questions: TaxonomyQuestion[] = [];
  let guard = 0;
  const maxAttempts = size * TYPES.length + TYPES.length;
  while (questions.length < size && guard < maxAttempts) {
    const type = TYPES[questions.length % TYPES.length];
    const q = BUILDERS[type](pool, rng);
    if (q) questions.push(q);
    else {
      // 이 유형이 불가하면 다른 유형으로라도 채운다.
      const alt = TYPES.map((t) => BUILDERS[t](pool, rng)).find(Boolean);
      if (alt) questions.push(alt);
    }
    guard += 1;
  }

  return {
    id: makeId(rng),
    questions,
    currentIndex: 0,
    streak: 0,
    maxStreak: 0,
  };
}

/** 지금 풀 문제. 끝났으면 undefined. */
export function nextTaxonomyQuestion(
  session: TaxonomySession
): TaxonomyQuestion | undefined {
  return session.questions[session.currentIndex];
}

/**
 * 답안 제출. 재시도/스트릭 규칙은 quiz.service.submitAnswer와 동일:
 * 첫 오답 → 재시도(미공개·진행 안 함) / 두 번째 오답 → 공개 후 진행.
 * 스트릭은 1번에 힌트 없이 맞힌 경우만 +1. 종 SRS는 갱신하지 않는다.
 */
export function submitTaxonomyAnswer(
  session: TaxonomySession,
  answerId: string,
  usedHint: boolean
): TaxonomyAnswerResult {
  const q = session.questions[session.currentIndex];
  if (!q) throw new Error("제출할 활성 문제가 없습니다 (세션이 이미 종료됨).");

  q.attemptCount += 1;
  q.usedHint = q.usedHint || usedHint;
  const correct = answerId === q.correctId;

  if (!correct) {
    session.streak = 0;
    if (q.attemptCount === 1) {
      return { correct: false, isRetry: true, correctId: q.correctId };
    }
    q.resolvedCorrect = false;
    session.currentIndex += 1;
    return { correct: false, isRetry: false, correctId: q.correctId };
  }

  if (q.attemptCount === 1 && !q.usedHint) {
    session.streak += 1;
    if (session.streak > session.maxStreak) session.maxStreak = session.streak;
  }
  q.resolvedCorrect = true;
  session.currentIndex += 1;
  return { correct: true, isRetry: false, correctId: q.correctId };
}
