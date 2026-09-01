import { describe, it, expect } from "vitest";
import {
  createTaxonomySession,
  nextTaxonomyQuestion,
  submitTaxonomyAnswer,
} from "@/services/taxonomy.service";
import { taxonKo, familyKo } from "@/lib/taxonomy-labels";
import type { Species } from "@/types";

function sp(id: string, order: string, family: string): Species {
  return {
    id,
    name_korean: id,
    name_latin: id,
    name_english: id,
    order,
    family,
    habitat: [],
    difficulty_tier: 1,
    abundance: "c",
    status: ["Res"],
    media: [],
    trivia: [],
  };
}

// 6목·6과, 큰 과 3개(Anatidae4·Corvidae4·Ardeidae3)
const POOL: Species[] = [
  ...["d1", "d2", "d3", "d4"].map((i) => sp(i, "Anseriformes", "Anatidae")),
  ...["c1", "c2", "c3", "c4"].map((i) => sp(i, "Passeriformes", "Corvidae")),
  ...["h1", "h2", "h3"].map((i) => sp(i, "Pelecaniformes", "Ardeidae")),
  sp("w1", "Piciformes", "Picidae"),
  sp("p1", "Columbiformes", "Columbidae"),
  sp("r1", "Gruiformes", "Rallidae"),
];

// 결정론 rng (MINSTD)
function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const D = (seed = 1, size = 9) => ({ rng: rng(seed), pool: POOL, size });

describe("createTaxonomySession", () => {
  it("size개 문제를 만들고 3가지 유형을 고르게 섞는다", () => {
    const s = createTaxonomySession(D(1, 9));
    expect(s.questions).toHaveLength(9);
    const byType: Record<string, number> = {};
    s.questions.forEach((q) => (byType[q.type] = (byType[q.type] ?? 0) + 1));
    expect(byType["photo-to-taxon"]).toBe(3);
    expect(byType["odd-one-out"]).toBe(3);
    expect(byType["family-membership"]).toBe(3);
  });

  it("모든 문제는 4지선다이고 정답이 보기 안에 있다", () => {
    const s = createTaxonomySession(D(2, 9));
    for (const q of s.questions) {
      expect(q.choices).toHaveLength(4);
      const ids = q.choices.map((c) => c.id);
      expect(new Set(ids).size).toBe(4); // 중복 없음
      expect(ids).toContain(q.correctId);
    }
  });

  it("유형1(photo-to-taxon): 정답 라벨이 promptSpecies의 목/과 한국어명과 일치", () => {
    const s = createTaxonomySession(D(3, 9));
    const q = s.questions.find((x) => x.type === "photo-to-taxon")!;
    expect(q.promptSpecies).toBeDefined();
    expect(q.taxonLevel === "order" || q.taxonLevel === "family").toBe(true);
    expect(q.correctId).toBe(q.promptSpecies![q.taxonLevel!]);
    const correctChoice = q.choices.find((c) => c.id === q.correctId)!;
    expect(correctChoice.label).toBe(taxonKo(q.taxonLevel!, q.correctId));
  });

  it("유형2(odd-one-out): 정답 종의 과가 나머지 3종과 다르다", () => {
    const s = createTaxonomySession(D(4, 9));
    const q = s.questions.find((x) => x.type === "odd-one-out")!;
    const odd = q.choices.find((c) => c.id === q.correctId)!.species!;
    const rest = q.choices
      .filter((c) => c.id !== q.correctId)
      .map((c) => c.species!);
    expect(rest.every((r) => r.family !== odd.family)).toBe(true);
    // 나머지 3종은 같은 과
    expect(new Set(rest.map((r) => r.family)).size).toBe(1);
  });

  it("유형3(family-membership): askBelongs에 맞게 정답 종의 소속이 정해진다", () => {
    const s = createTaxonomySession(D(5, 9));
    const q = s.questions.find((x) => x.type === "family-membership")!;
    expect(q.familyLabel).toBeDefined();
    const correct = q.choices.find((c) => c.id === q.correctId)!.species!;
    if (q.askBelongs) {
      expect(familyKo(correct.family)).toBe(q.familyLabel);
    } else {
      expect(familyKo(correct.family)).not.toBe(q.familyLabel);
    }
  });

  it("큰 과가 없으면 유형2를 건너뛰고도 size를 채운다", () => {
    const singletons: Species[] = [
      sp("a", "O1", "F1"),
      sp("b", "O2", "F2"),
      sp("c", "O3", "F3"),
      sp("d", "O4", "F4"),
      sp("e", "O5", "F5"),
    ];
    const s = createTaxonomySession({ rng: rng(7), pool: singletons, size: 6 });
    expect(s.questions.length).toBe(6);
    expect(s.questions.every((q) => q.type !== "odd-one-out")).toBe(true);
  });
});

describe("submitTaxonomyAnswer", () => {
  const wrongId = (q: { choices: { id: string }[]; correctId: string }) =>
    q.choices.find((c) => c.id !== q.correctId)!.id;

  it("1번에 정답 → 스트릭 +1, 진행, resolvedCorrect=true", () => {
    const s = createTaxonomySession(D(1, 3));
    const q = nextTaxonomyQuestion(s)!;
    const r = submitTaxonomyAnswer(s, q.correctId, false);
    expect(r.correct).toBe(true);
    expect(s.streak).toBe(1);
    expect(q.resolvedCorrect).toBe(true);
    expect(s.currentIndex).toBe(1);
  });

  it("첫 오답 → 재시도(미진행), 두 번째 오답 → 공개 후 진행", () => {
    const s = createTaxonomySession(D(1, 3));
    const q = nextTaxonomyQuestion(s)!;
    const r1 = submitTaxonomyAnswer(s, wrongId(q), false);
    expect(r1.isRetry).toBe(true);
    expect(s.currentIndex).toBe(0);
    const r2 = submitTaxonomyAnswer(s, wrongId(q), false);
    expect(r2.isRetry).toBe(false);
    expect(q.resolvedCorrect).toBe(false);
    expect(s.currentIndex).toBe(1);
    expect(s.streak).toBe(0);
  });

  it("힌트 사용 정답은 스트릭을 올리지 않는다", () => {
    const s = createTaxonomySession(D(1, 3));
    const q = nextTaxonomyQuestion(s)!;
    submitTaxonomyAnswer(s, q.correctId, true);
    expect(s.streak).toBe(0);
    expect(q.resolvedCorrect).toBe(true);
  });
});
