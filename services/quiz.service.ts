import type {
  Species,
  SRSQuality,
  DifficultyTier,
  QuizSession,
  QuizSessionOptions,
  QuizQuestion,
  AnswerResult,
  MatchingPair,
} from "@/types";
import { getAll, selectDecoys } from "@/services/species.service";

// ─── QuizService · 퀴즈 세션 코어 (STORY-009) ──────────────────────────────────
//
// 함수형 서비스. species.service의 순수함수(selectDecoys) 위에서 세션을 조립하고,
// 진행 상태를 담은 QuizSession을 in-place로 갱신한다. rng·데이터 주입으로 결정론적.
//
// scope(weak/review/habitat)별 대상 선정은 QuizService의 관심사가 아니다.
// 호출부가 후보 pool을 주입한다(의존성 역전) → ProgressService(STORY-008)나
// 서식지 필터(STORY-016)가 나중에 붙어도 이 코어는 바뀌지 않는다.

const CHOICES_PER_QUESTION = 4;
const DECOYS_PER_QUESTION = CHOICES_PER_QUESTION - 1;
const MAX_MATCHING_PAIRS = 10;

export interface CreateSessionDeps {
  rng?: () => number;
  /** 문제로 낼 대상 종 후보. scope별 선택은 호출부가 결정해 주입한다. 기본: 전체 종. */
  pool?: Species[];
  /** 오답 보기 후보. 기본: 전체 종. */
  decoyPool?: Species[];
  /**
   * 반드시 세션에 포함할 종(예: 오늘의 새). pool 셔플에 밀려나지 않음을 보장한다.
   * pool에 없어도 강제로 넣는다. id 기준 dedupe 후 size개까지만 반영. 나머지는 pool로 채움.
   */
  mustInclude?: Species[];
}

/** Fisher-Yates 셔플 (rng 주입 결정론). 원본 불변. */
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 난이도 tier → 1번에 스스로 정답 시 SRS quality. tier1→5, 2→4, 3→3(어려울수록 더 자주 복습). */
function cleanQuality(tier: DifficultyTier): SRSQuality {
  return (6 - tier) as SRSQuality;
}

/** rng 기반 세션 id(주입 시 결정론적, Date 미사용). */
function makeId(rng: () => number): string {
  return "session-" + Math.floor(rng() * 0xffffffff).toString(36);
}

/** 문제를 마감하고 다음으로 진행한다. */
function resolveAndAdvance(session: QuizSession, question: QuizQuestion): void {
  session.completedSpeciesIds.push(question.species.id);
  session.currentIndex += 1;
}

/** 세션 생성. options.size개의 문제(각 4지선다)를 pool에서 중복 없이 만든다. */
export function createSession(
  options: QuizSessionOptions,
  deps: CreateSessionDeps = {}
): QuizSession {
  const rng = deps.rng ?? Math.random;
  const pool = deps.pool ?? getAll();
  const decoyPool = deps.decoyPool ?? getAll();
  const size = Math.max(0, options.size);

  // mustInclude 종을 먼저 확정(id dedupe, size 상한)한 뒤, 남은 자리를 pool 셔플로 채운다.
  // 그래야 종 수가 size를 넘어도 오늘의 새 등 필수 종이 셔플에 밀려나지 않는다.
  const forced: Species[] = [];
  const forcedIds = new Set<string>();
  for (const s of deps.mustInclude ?? []) {
    if (forced.length >= size) break;
    if (!forcedIds.has(s.id)) {
      forcedIds.add(s.id);
      forced.push(s);
    }
  }
  const fill = shuffle(
    forcedIds.size ? pool.filter((s) => !forcedIds.has(s.id)) : pool,
    rng
  ).slice(0, size - forced.length);
  // forced가 없으면 기존 동작(pool 셔플 slice)과 동일 — rng 소비 순서까지 보존.
  const targets = forced.length ? shuffle([...forced, ...fill], rng) : fill;
  const questions: QuizQuestion[] = targets.map((species) => {
    const decoys = selectDecoys(species, decoyPool, DECOYS_PER_QUESTION, rng);
    return {
      species,
      choices: shuffle([species, ...decoys], rng),
      correctId: species.id,
      usedHint: false,
      attemptCount: 0,
    };
  });

  return {
    id: makeId(rng),
    options,
    questions,
    currentIndex: 0,
    streak: 0,
    maxStreak: 0,
    completedSpeciesIds: [],
  };
}

/** 지금 풀어야 할 문제. 세션이 끝났으면 undefined. */
export function nextQuestion(session: QuizSession): QuizQuestion | undefined {
  return session.questions[session.currentIndex];
}

/**
 * 답안 제출. 세션 상태를 in-place로 갱신하고 결과를 반환한다.
 * (QuizSession은 진행 상태를 담는 가변 컨테이너 — React에서는 갱신 후 복제해 setState)
 *
 * 재시도 규칙: 첫 오답 → isRetry(정답 미공개, 진행 안 함) / 두 번째 오답 → 정답 공개 후 진행.
 * 반환 quality는 isRetry === false 일 때만 SRS에 반영할 것(재시도 중에는 미확정).
 */
export function submitAnswer(
  session: QuizSession,
  answerId: string,
  usedHint: boolean
): AnswerResult {
  const question = session.questions[session.currentIndex];
  if (!question) {
    throw new Error("제출할 활성 문제가 없습니다 (세션이 이미 종료됨).");
  }

  question.attemptCount += 1;
  question.usedHint = question.usedHint || usedHint;
  const correct = answerId === question.correctId;

  if (!correct) {
    session.streak = 0;
    if (question.attemptCount === 1) {
      // 첫 오답 → 재시도 기회. 정답 미공개, 진행하지 않음.
      return {
        correct: false,
        isRetry: true,
        quality: 0,
        correctSpecies: question.species,
      };
    }
    // 두 번째 오답 → 정답 공개하고 진행.
    question.resolvedCorrect = false;
    resolveAndAdvance(session, question);
    return {
      correct: false,
      isRetry: false,
      quality: 0,
      correctSpecies: question.species,
    };
  }

  // 정답 — quality 결정
  let quality: SRSQuality;
  if (question.attemptCount > 1) {
    quality = 1; // 재시도 정답
  } else if (question.usedHint) {
    quality = 2; // 힌트 정답
  } else {
    quality = cleanQuality(question.species.difficulty_tier); // 1번에 스스로 정답
    session.streak += 1;
    if (session.streak > session.maxStreak) session.maxStreak = session.streak;
  }

  question.resolvedCorrect = true;
  resolveAndAdvance(session, question);
  return {
    correct: true,
    isRetry: false,
    quality,
    correctSpecies: question.species,
  };
}

/** 세션 결과 요약(STORY-013 결과 화면 · AC5). */
export interface SessionSummary {
  correct: number;
  incorrect: number;
  maxStreak: number;
  total: number;
}

/**
 * 세션의 문제별 최종 결과(resolvedCorrect)를 집계한다.
 * 정답=재시도/힌트 포함 최종 정답, 오답=두 번 틀려 공개된 문제.
 * 아직 미확정(undefined)인 문제는 어느 쪽에도 넣지 않는다.
 */
export function getSessionSummary(session: QuizSession): SessionSummary {
  let correct = 0;
  let incorrect = 0;
  for (const q of session.questions) {
    if (q.resolvedCorrect === true) correct += 1;
    else if (q.resolvedCorrect === false) incorrect += 1;
  }
  return {
    correct,
    incorrect,
    maxStreak: session.maxStreak,
    total: session.questions.length,
  };
}

/**
 * 세션 마무리 짝짓기 라운드 데이터(STORY-013용). 세션 종을 최대 10개까지 반환한다.
 * wasEasy = 1번에 힌트 없이 스스로 맞힌 종. (세션 종료 시점 호출 기준 — 그 시점엔
 * attemptCount===1 이면 첫 시도 정답이 확정된다.)
 */
export function getMatchingRound(session: QuizSession): MatchingPair[] {
  return session.questions.slice(0, MAX_MATCHING_PAIRS).map((q) => ({
    species: q.species,
    matched: false,
    wasEasy: q.attemptCount === 1 && !q.usedHint,
  }));
}
