import { describe, it, expect } from "vitest";
import {
  createSession,
  nextQuestion,
  submitAnswer,
  getMatchingRound,
  getSessionSummary,
} from "@/services/quiz.service";
import type { Species, DifficultyTier, QuizSessionOptions } from "@/types";

// ─── 픽스처 ─────────────────────────────────────────────────────────────────────

function sp(
  id: string,
  order = "Passeriformes",
  family = "Corvidae",
  tier: DifficultyTier = 1
): Species {
  return {
    id,
    name_korean: id,
    name_latin: id,
    name_english: id,
    order,
    family,
    habitat: [],
    difficulty_tier: tier,
    abundance: "c",
    status: ["Res"],
    media: [],
    trivia: [],
  };
}

// 目/科가 다양해 tier별 오답 거리감이 항상 3개 채워지는 풀
const POOL: Species[] = [
  sp("magpie", "Passeriformes", "Corvidae", 1),
  sp("crow", "Passeriformes", "Corvidae", 3),
  sp("sparrow", "Passeriformes", "Passeridae", 1),
  sp("swallow", "Passeriformes", "Hirundinidae", 2),
  sp("heron", "Pelecaniformes", "Ardeidae", 1),
  sp("egret", "Pelecaniformes", "Ardeidae", 3),
  sp("duck", "Anseriformes", "Anatidae", 1),
  sp("hawk", "Accipitriformes", "Accipitridae", 2),
];

function opts(
  size = 5,
  scope: QuizSessionOptions["scope"] = "all"
): QuizSessionOptions {
  return { mode: "photo-to-name", scope, size };
}

// 결정론적 rng (Lehmer / MINSTD)
function seededRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const D = (seed = 1) => ({ rng: seededRng(seed), pool: POOL, decoyPool: POOL });
const wrongIdFor = (choices: Species[], correctId: string) =>
  choices.find((c) => c.id !== correctId)!.id;

// ─── createSession ──────────────────────────────────────────────────────────────

describe("quiz.service · createSession", () => {
  it("size개의 문제를 만들고 초기 상태를 세팅한다", () => {
    const s = createSession(opts(5), D(1));
    expect(s.questions).toHaveLength(5);
    expect(s.currentIndex).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.maxStreak).toBe(0);
    expect(s.completedSpeciesIds).toEqual([]);
    expect(typeof s.id).toBe("string");
    expect(s.id.length).toBeGreaterThan(0);
    expect(s.options.mode).toBe("photo-to-name");
  });

  it("세션 내 종은 중복되지 않는다", () => {
    const s = createSession(opts(8), D(2));
    const ids = s.questions.map((q) => q.species.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("각 문제는 정답 포함 4지선다, 초기 attempt/hint 상태다", () => {
    const s = createSession(opts(5), D(3));
    for (const q of s.questions) {
      expect(q.correctId).toBe(q.species.id);
      expect(q.choices.map((c) => c.id)).toContain(q.species.id);
      expect(q.choices).toHaveLength(4);
      expect(q.attemptCount).toBe(0);
      expect(q.usedHint).toBe(false);
    }
  });

  it("size가 풀보다 크면 풀 크기만큼만(중복 없이) 만든다", () => {
    const s = createSession(opts(100), D(4));
    expect(s.questions).toHaveLength(POOL.length);
    expect(new Set(s.questions.map((q) => q.species.id)).size).toBe(POOL.length);
  });

  it("pool 미주입 시 실데이터(getAll)로 폴백한다", () => {
    const s = createSession(opts(2));
    expect(s.questions.length).toBeGreaterThan(0);
    expect(s.questions.length).toBeLessThanOrEqual(2);
  });

  it("scope에 상관없이 주입된 pool을 대상으로 쓴다 (STORY-008 연동 seam)", () => {
    const weakPool = [sp("w1"), sp("w2")];
    const s = createSession(opts(5, "weak"), {
      rng: seededRng(8),
      pool: weakPool,
      decoyPool: POOL,
    });
    expect(s.questions.map((q) => q.species.id).sort()).toEqual(["w1", "w2"]);
    expect(s.options.scope).toBe("weak");
  });

  // ── mustInclude: 종 수가 size를 넘어도 필수 종(오늘의 새)이 셔플에 밀려나지 않음 ──
  it("종이 size보다 많아도 mustInclude 종은 어떤 시드에서도 반드시 포함된다", () => {
    const focus = POOL[POOL.length - 1]; // "hawk" — pool 8종 중 마지막
    for (let seed = 1; seed <= 25; seed++) {
      const s = createSession(opts(3), {
        rng: seededRng(seed),
        pool: POOL,
        decoyPool: POOL,
        mustInclude: [focus],
      });
      const ids = s.questions.map((q) => q.species.id);
      expect(s.questions).toHaveLength(3);
      expect(ids).toContain(focus.id);
      expect(new Set(ids).size).toBe(ids.length); // 중복 없음
    }
  });

  it("mustInclude 종이 pool에 없어도 강제로 넣고 나머지는 pool로 채운다", () => {
    const focus = sp("today-special", "Gruiformes", "Rallidae", 1);
    const s = createSession(opts(3), {
      rng: seededRng(3),
      pool: POOL,
      decoyPool: POOL,
      mustInclude: [focus],
    });
    const ids = s.questions.map((q) => q.species.id);
    expect(ids).toContain("today-special");
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it("mustInclude가 size보다 많으면 size개(모두 forced에서)로 자른다", () => {
    const forced = [sp("a"), sp("b"), sp("c"), sp("d")];
    const s = createSession(opts(2), {
      rng: seededRng(1),
      pool: POOL,
      decoyPool: POOL,
      mustInclude: forced,
    });
    const ids = s.questions.map((q) => q.species.id);
    expect(ids).toHaveLength(2);
    expect(ids.every((id) => ["a", "b", "c", "d"].includes(id))).toBe(true);
    expect(new Set(ids).size).toBe(2);
  });
});

// ─── nextQuestion ───────────────────────────────────────────────────────────────

describe("quiz.service · nextQuestion", () => {
  it("현재 인덱스의 문제를 반환한다", () => {
    const s = createSession(opts(3), D(3));
    expect(nextQuestion(s)).toBe(s.questions[0]);
  });

  it("모든 문제를 풀면 undefined를 반환한다", () => {
    const s = createSession(opts(3), D(3));
    let q = nextQuestion(s);
    while (q) {
      submitAnswer(s, q.correctId, false);
      q = nextQuestion(s);
    }
    expect(nextQuestion(s)).toBeUndefined();
    expect(s.currentIndex).toBe(3);
  });
});

// ─── submitAnswer ───────────────────────────────────────────────────────────────

describe("quiz.service · submitAnswer", () => {
  it("1번에 정답(tier별 quality 3~5), 스트릭 증가, 진행", () => {
    for (const [tier, q] of [
      [1, 5],
      [2, 4],
      [3, 3],
    ] as const) {
      const s = createSession(opts(1), {
        rng: seededRng(10 + tier),
        pool: [sp("t", "O", "F", tier as DifficultyTier)],
        decoyPool: POOL,
      });
      const question = nextQuestion(s)!;
      const r = submitAnswer(s, question.correctId, false);
      expect(r).toMatchObject({ correct: true, isRetry: false, quality: q });
      expect(r.correctSpecies.id).toBe("t");
      expect(s.streak).toBe(1);
      expect(s.maxStreak).toBe(1);
      expect(s.currentIndex).toBe(1);
      expect(s.completedSpeciesIds).toContain("t");
    }
  });

  it("힌트 정답 → quality 2, 스트릭 증가 안 함", () => {
    const s = createSession(opts(1), { ...D(5), pool: [sp("h")] });
    const q = nextQuestion(s)!;
    const r = submitAnswer(s, q.correctId, true);
    expect(r.quality).toBe(2);
    expect(s.streak).toBe(0);
  });

  it("첫 오답 → isRetry, 진행 안 함, 스트릭 리셋", () => {
    const s = createSession(opts(1), { ...D(6), pool: [sp("x")] });
    const q = nextQuestion(s)!;
    const r = submitAnswer(s, wrongIdFor(q.choices, q.correctId), false);
    expect(r).toMatchObject({ correct: false, isRetry: true, quality: 0 });
    expect(s.currentIndex).toBe(0);
    expect(q.attemptCount).toBe(1);
    expect(s.streak).toBe(0);
  });

  it("오답 후 재시도 정답 → quality 1, 진행", () => {
    const s = createSession(opts(1), { ...D(6), pool: [sp("x")] });
    const q = nextQuestion(s)!;
    submitAnswer(s, wrongIdFor(q.choices, q.correctId), false);
    const r = submitAnswer(s, q.correctId, false);
    expect(r).toMatchObject({ correct: true, isRetry: false, quality: 1 });
    expect(s.currentIndex).toBe(1);
    expect(s.streak).toBe(0);
  });

  it("두 번째 오답 → 정답 공개(quality 0), 진행", () => {
    const s = createSession(opts(1), { ...D(6), pool: [sp("x")] });
    const q = nextQuestion(s)!;
    const wrong = wrongIdFor(q.choices, q.correctId);
    submitAnswer(s, wrong, false);
    const r = submitAnswer(s, wrong, false);
    expect(r).toMatchObject({ correct: false, isRetry: false, quality: 0 });
    expect(r.correctSpecies.id).toBe(q.correctId);
    expect(s.currentIndex).toBe(1);
    expect(q.attemptCount).toBe(2);
  });

  it("스트릭: 연속 정답 누적, maxStreak 유지, 오답 시 리셋", () => {
    const s = createSession(opts(5), D(9));
    for (let i = 0; i < 3; i++) {
      submitAnswer(s, nextQuestion(s)!.correctId, false);
    }
    expect(s.streak).toBe(3);
    expect(s.maxStreak).toBe(3);
    const q = nextQuestion(s)!;
    const wrong = wrongIdFor(q.choices, q.correctId);
    submitAnswer(s, wrong, false);
    submitAnswer(s, wrong, false);
    expect(s.streak).toBe(0);
    expect(s.maxStreak).toBe(3);
  });

  it("quality 단조성: 재시도(1) < 힌트(2) < 1번에 정답(3~5) (STORY-012)", () => {
    // 재시도 정답
    const s1 = createSession(opts(1), { ...D(6), pool: [sp("x")] });
    const q1 = nextQuestion(s1)!;
    submitAnswer(s1, wrongIdFor(q1.choices, q1.correctId), false);
    const retry = submitAnswer(s1, q1.correctId, false).quality;
    // 힌트 정답
    const s2 = createSession(opts(1), { ...D(5), pool: [sp("h")] });
    const hinted = submitAnswer(s2, nextQuestion(s2)!.correctId, true).quality;
    // 1번에 스스로 정답 (tier1 → 5)
    const s3 = createSession(opts(1), {
      rng: seededRng(3),
      pool: [sp("c", "O", "F", 1)],
      decoyPool: POOL,
    });
    const clean = submitAnswer(s3, nextQuestion(s3)!.correctId, false).quality;

    expect(retry).toBeLessThan(hinted);
    expect(hinted).toBeLessThan(clean);
  });

  it("종료된 세션에 제출하면 에러", () => {
    const s = createSession(opts(1), { ...D(5), pool: [sp("only")] });
    submitAnswer(s, "only", false);
    expect(() => submitAnswer(s, "only", false)).toThrow();
  });
});

// ─── getMatchingRound ───────────────────────────────────────────────────────────

describe("quiz.service · getMatchingRound", () => {
  it("세션 종을 반환하고 1번에 맞힌 종만 wasEasy=true", () => {
    const s = createSession(opts(3), D(3));
    // q0: 1번에 정답
    submitAnswer(s, nextQuestion(s)!.correctId, false);
    // q1: 재시도 정답
    const q1 = nextQuestion(s)!;
    submitAnswer(s, wrongIdFor(q1.choices, q1.correctId), false);
    submitAnswer(s, q1.correctId, false);
    // q2: 미응답
    const pairs = getMatchingRound(s);
    expect(pairs).toHaveLength(3);
    expect(pairs.every((p) => p.matched === false)).toBe(true);
    expect(pairs[0].wasEasy).toBe(true);
    expect(pairs[1].wasEasy).toBe(false);
    expect(pairs[2].wasEasy).toBe(false);
  });

  it("최대 10쌍으로 제한한다", () => {
    const big = Array.from({ length: 15 }, (_, i) =>
      sp("b" + i, "O" + (i % 3), "F" + (i % 4), ((i % 3) + 1) as DifficultyTier)
    );
    const s = createSession(opts(15), {
      rng: seededRng(7),
      pool: big,
      decoyPool: big,
    });
    expect(s.questions).toHaveLength(15);
    expect(getMatchingRound(s)).toHaveLength(10);
  });
});

// ─── resolvedCorrect / getSessionSummary (STORY-013) ─────────────────────────────

describe("quiz.service · resolvedCorrect", () => {
  it("1번에 정답이면 resolvedCorrect=true", () => {
    const s = createSession(opts(1), D(3));
    const q = nextQuestion(s)!;
    submitAnswer(s, q.correctId, false);
    expect(q.resolvedCorrect).toBe(true);
  });

  it("재시도 후 정답도 resolvedCorrect=true", () => {
    const s = createSession(opts(1), D(3));
    const q = nextQuestion(s)!;
    submitAnswer(s, wrongIdFor(q.choices, q.correctId), false);
    submitAnswer(s, q.correctId, false);
    expect(q.resolvedCorrect).toBe(true);
  });

  it("두 번 틀려 공개되면 resolvedCorrect=false", () => {
    const s = createSession(opts(1), D(3));
    const q = nextQuestion(s)!;
    const wrong = wrongIdFor(q.choices, q.correctId);
    submitAnswer(s, wrong, false);
    submitAnswer(s, wrong, false);
    expect(q.resolvedCorrect).toBe(false);
  });

  it("첫 오답(재시도 중)에는 아직 미확정(undefined)", () => {
    const s = createSession(opts(1), D(3));
    const q = nextQuestion(s)!;
    submitAnswer(s, wrongIdFor(q.choices, q.correctId), false);
    expect(q.resolvedCorrect).toBeUndefined();
  });
});

describe("quiz.service · getSessionSummary", () => {
  it("정답/오답/최고 스트릭/총계를 집계한다", () => {
    const s = createSession(opts(3), D(3));
    // q0: 1번에 정답 (streak 1)
    submitAnswer(s, nextQuestion(s)!.correctId, false);
    // q1: 두 번 틀려 공개 (오답)
    const q1 = nextQuestion(s)!;
    const wrong1 = wrongIdFor(q1.choices, q1.correctId);
    submitAnswer(s, wrong1, false);
    submitAnswer(s, wrong1, false);
    // q2: 1번에 정답
    submitAnswer(s, nextQuestion(s)!.correctId, false);

    const summary = getSessionSummary(s);
    expect(summary.correct).toBe(2);
    expect(summary.incorrect).toBe(1);
    expect(summary.total).toBe(3);
    expect(summary.maxStreak).toBe(s.maxStreak);
  });

  it("미응답 문제는 어느 쪽에도 세지 않는다", () => {
    const s = createSession(opts(3), D(3));
    submitAnswer(s, nextQuestion(s)!.correctId, false); // q0만 정답
    const summary = getSessionSummary(s);
    expect(summary.correct).toBe(1);
    expect(summary.incorrect).toBe(0);
    expect(summary.total).toBe(3);
  });
});
