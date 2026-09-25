import { describe, it, expect } from "vitest";
import type { Species, DifficultyTier, Abundance, Status } from "@/types";
import {
  sanitizeMedia,
  getAll,
  getById,
  getByDifficulty,
  getEffectiveTier,
  getMediaUpToTier,
  getConfusables,
  getRandom,
  selectDecoys,
  getDecoys,
  getHabitats,
} from "./species.service";

// ─── Test helpers ──────────────────────────────────────────────────────────────

function makeSpecies(overrides: Partial<Species> = {}): Species {
  return {
    id: "sp-" + Math.random().toString(36).slice(2, 8),
    name_korean: "테스트새",
    name_latin: "Testus avis",
    name_english: "Test Bird",
    order: "Passeriformes",
    family: "Testidae",
    habitat: ["도시·마을"],
    difficulty_tier: 1,
    abundance: "c",
    status: ["Res"],
    media: [
      {
        url: "https://example.com/p.jpg",
        sex: "unknown",
        age: "adult",
        plumage: "unknown",
        angle: "unknown",
        license: "CC-BY-NC",
        attribution: "(c) Tester",
        quality_score: 2,
      },
    ],
    trivia: [
      { content: "사실", type: "ecology", trivia_source: "출처" },
    ],
    ...overrides,
  };
}

/** 순차 값을 반환하는 결정론적 rng (Fisher-Yates·인덱스 선택 테스트용). */
function seededRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

// ─── sanitizeMedia (NFR-004) ────────────────────────────────────────────────────

describe("sanitizeMedia", () => {
  it("attribution이 빈 사진을 제거한다", () => {
    const s = makeSpecies({
      media: [
        { ...makeSpecies().media[0], attribution: "" },
        { ...makeSpecies().media[0], attribution: "(c) Valid" },
      ],
    });
    const result = sanitizeMedia(s);
    expect(result.media).toHaveLength(1);
    expect(result.media[0].attribution).toBe("(c) Valid");
  });

  it("license가 공백뿐인 사진을 제거한다", () => {
    const s = makeSpecies({
      media: [{ ...makeSpecies().media[0], license: "   " }],
    });
    expect(sanitizeMedia(s).media).toHaveLength(0);
  });

  it("유효한 사진은 유지하고 원본을 변형하지 않는다", () => {
    const s = makeSpecies();
    const result = sanitizeMedia(s);
    expect(result.media).toHaveLength(1);
    expect(result).not.toBe(s);
  });
});

// ─── getAll ─────────────────────────────────────────────────────────────────────

describe("getAll (실데이터)", () => {
  it("필터 없이 전체 종을 반환한다", () => {
    expect(getAll().length).toBeGreaterThanOrEqual(2);
  });

  it("status 필터: Res만 요청하면 텃새만 반환한다", () => {
    const res = getAll({ status: ["Res"] });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((s) => s.status.includes("Res"))).toBe(true);
    expect(res.some((s) => s.id === "pica-serica")).toBe(true);
    expect(res.some((s) => s.id === "hirundo-rustica")).toBe(false);
  });

  it("status 필터: SV만 요청하면 여름철새만 반환한다", () => {
    const sv = getAll({ status: ["SV"] });
    expect(sv.every((s) => s.status.includes("SV"))).toBe(true);
    expect(sv.some((s) => s.id === "hirundo-rustica")).toBe(true);
  });

  it("abundance 필터를 적용한다", () => {
    const common = getAll({ abundance: ["c"] });
    expect(common.every((s) => s.abundance === "c")).toBe(true);
  });

  it("존재하지 않는 조합이면 빈 배열", () => {
    // 130종 확장(2026-09)으로 abundance "r"(황새)이 실데이터에 생겨, 정말 없는 조합만 확인한다.
    expect(getAll({ status: ["Probably extinct"] as Status[] })).toHaveLength(0);
    expect(
      getAll({ status: ["Vag"] as Status[], abundance: ["ab"] as Abundance[] })
    ).toHaveLength(0);
  });

  it("모든 반환 종의 사진에 attribution이 채워져 있다 (NFR-004)", () => {
    for (const s of getAll()) {
      for (const m of s.media) {
        expect(m.attribution.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── getById ─────────────────────────────────────────────────────────────────────

describe("getById (실데이터)", () => {
  it("존재하는 id를 반환한다", () => {
    expect(getById("pica-serica")?.name_korean).toBe("까치");
  });

  it("없는 id면 undefined", () => {
    expect(getById("no-such-bird")).toBeUndefined();
  });
});

// ─── getByDifficulty ─────────────────────────────────────────────────────────────

describe("getByDifficulty (실데이터)", () => {
  it("tier 1 종을 반환한다", () => {
    const t1 = getByDifficulty(1);
    expect(t1.length).toBeGreaterThanOrEqual(2);
    expect(t1.every((s) => s.difficulty_tier === 1)).toBe(true);
  });

  it("tier 1·2·3 이 모두 존재하고 합이 전체 종 수와 같다", () => {
    const counts = ([1, 2, 3] as DifficultyTier[]).map((t) => getByDifficulty(t).length);
    expect(counts.every((c) => c > 0)).toBe(true);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(getAll().length);
  });

});

// ─── 사진별 실효 난이도 ───────────────────────────────────────────────────────────

describe("getEffectiveTier / getMediaUpToTier", () => {
  const male = { ...makeSpecies().media[0], sex: "male" as const };
  const female = { ...male, sex: "female" as const, difficulty_tier: 3 as const };
  const duck = makeSpecies({ difficulty_tier: 1, media: [male, female] });

  it("사진에 tier가 없으면 종 tier를 따른다", () => {
    expect(getEffectiveTier(duck, male)).toBe(1);
    expect(getEffectiveTier(duck)).toBe(1);
  });

  it("사진에 tier가 있으면 그 값을 쓴다", () => {
    expect(getEffectiveTier(duck, female)).toBe(3);
  });

  it("maxTier 이하 사진만 남긴다", () => {
    expect(getMediaUpToTier(duck, 1)).toEqual([male]);
    expect(getMediaUpToTier(duck, 3)).toHaveLength(2);
  });

  it("getConfusables: pool에 있는 혼동 상대만 돌려준다", () => {
    const t = makeSpecies({ id: "t", confusable_with: ["a", "zzz"] });
    const a = makeSpecies({ id: "a" });
    expect(getConfusables(t, [t, a]).map((x) => x.id)).toEqual(["a"]);
    expect(getConfusables(makeSpecies({ id: "n" }), [a])).toEqual([]);
  });

  it("실데이터: 혼동 상대가 있는 종은 그 상대가 카탈로그에 존재한다", () => {
    const all = getAll();
    const ids = new Set(all.map((s) => s.id));
    for (const s of all) {
      for (const other of s.confusable_with ?? []) {
        expect(ids.has(other), `${s.name_korean} → ${other}`).toBe(true);
      }
    }
  });
});

// ─── getRandom ───────────────────────────────────────────────────────────────────

describe("getRandom (실데이터)", () => {
  it("excludeIds에 속한 종은 반환하지 않는다", () => {
    const picked = getRandom(["pica-serica"], () => 0);
    expect(picked?.id).not.toBe("pica-serica");
  });

  it("rng로 인덱스를 결정론적으로 선택한다", () => {
    const all = getAll();
    const first = getRandom([], () => 0);
    expect(first?.id).toBe(all[0].id);
  });

  it("후보가 모두 제외되면 undefined", () => {
    const allIds = getAll().map((s) => s.id);
    expect(getRandom(allIds)).toBeUndefined();
  });
});

// ─── selectDecoys (합성 데이터로 거리감 규칙 검증) ─────────────────────────────────

describe("selectDecoys", () => {
  // 분류 거리별 후보를 갖춘 합성 풀
  const target = makeSpecies({
    id: "target",
    order: "Passeriformes",
    family: "Corvidae",
    difficulty_tier: 1,
  });
  const sameFamily1 = makeSpecies({ id: "sf1", order: "Passeriformes", family: "Corvidae" });
  const sameFamily2 = makeSpecies({ id: "sf2", order: "Passeriformes", family: "Corvidae" });
  const sameOrder1 = makeSpecies({ id: "so1", order: "Passeriformes", family: "Hirundinidae" });
  const sameOrder2 = makeSpecies({ id: "so2", order: "Passeriformes", family: "Paridae" });
  const diffOrder1 = makeSpecies({ id: "do1", order: "Anseriformes", family: "Anatidae" });
  const diffOrder2 = makeSpecies({ id: "do2", order: "Charadriiformes", family: "Laridae" });
  const pool = [target, sameFamily1, sameFamily2, sameOrder1, sameOrder2, diffOrder1, diffOrder2];

  const rng = () => 0; // 셔플 시 각 그룹의 원소 순서를 안정적으로 유지

  it("대상 자신은 오답 보기에 포함되지 않는다", () => {
    const decoys = selectDecoys(target, pool, 3, rng);
    expect(decoys.some((d) => d.id === "target")).toBe(false);
  });

  it("count 개수만큼 반환하고 중복이 없다", () => {
    const decoys = selectDecoys(target, pool, 3, rng);
    expect(decoys).toHaveLength(3);
    expect(new Set(decoys.map((d) => d.id)).size).toBe(3);
  });

  it("level 1(기본): 다른 目을 우선한다", () => {
    const decoys = selectDecoys(target, pool, 2, rng);
    expect(decoys.every((d) => d.order !== target.order)).toBe(true);
  });

  it("level 3: 같은 科 유사종을 우선한다", () => {
    const decoys = selectDecoys(target, pool, 2, rng, 3);
    expect(decoys.every((d) => d.family === "Corvidae" && d.id !== "target")).toBe(true);
  });

  it("level 2: 같은 目 다른 科를 우선한다", () => {
    const decoys = selectDecoys(target, pool, 2, rng, 2);
    expect(
      decoys.every((d) => d.order === target.order && d.family !== target.family)
    ).toBe(true);
  });

  it("level 3: 혼동 상대(confusable_with)가 같은 科보다 먼저 온다", () => {
    const t = makeSpecies({ ...target, confusable_with: ["sf2"] });
    const decoys = selectDecoys(t, pool, 1, rng, 3);
    expect(decoys[0].id).toBe("sf2");
  });

  it("level 1: 혼동 상대는 다른 후보가 다 떨어져야 나온다", () => {
    const t = makeSpecies({ ...target, confusable_with: ["sf2"] });
    const decoys = selectDecoys(t, pool, 6, rng, 1); // 후보 6개 전부
    expect(decoys).toHaveLength(6);
    expect(decoys.map((d) => d.id).indexOf("sf2")).toBe(5);
    expect(selectDecoys(t, pool, 3, rng, 1).some((d) => d.id === "sf2")).toBe(false);
  });

  it("우선 그룹이 부족하면 다음 거리 그룹으로 넘어가 채운다", () => {
    // level 3인데 같은 科 후보가 1개뿐 → count 3을 채우려면 다른 그룹까지 확장
    const smallPool = [target, sameFamily1, sameOrder1, diffOrder1];
    const decoys = selectDecoys(target, smallPool, 3, rng, 3);
    expect(decoys).toHaveLength(3);
    expect(decoys[0].id).toBe("sf1"); // 같은 科가 먼저
  });

  it("후보가 count보다 적으면 가능한 만큼만 반환한다", () => {
    const decoys = selectDecoys(target, [target, sameFamily1], 3, rng);
    expect(decoys).toHaveLength(1);
    expect(decoys[0].id).toBe("sf1");
  });
});

// ─── getDecoys (실데이터 통합) ────────────────────────────────────────────────────

describe("getDecoys (실데이터)", () => {
  it("대상을 제외하고 count 이하의 오답 보기를 반환한다", () => {
    const magpie = getById("pica-serica")!;
    const decoys = getDecoys(magpie, 3);
    expect(decoys.some((d) => d.id === magpie.id)).toBe(false);
    expect(decoys.length).toBeLessThanOrEqual(3);
  });
});

// ─── getHabitats (서식지별 범위 · STORY-016) ─────────────────────────────────────

describe("getHabitats (실데이터)", () => {
  it("서식지 태그를 빈도 내림차순으로 반환한다", () => {
    const habitats = getHabitats();
    expect(habitats.length).toBeGreaterThan(0);
    for (let i = 1; i < habitats.length; i++) {
      expect(habitats[i - 1].count).toBeGreaterThanOrEqual(habitats[i].count);
    }
  });

  it("각 count는 해당 서식지를 가진 실제 종 수와 일치한다", () => {
    for (const { habitat, count } of getHabitats()) {
      const actual = getAll().filter((s) => s.habitat.includes(habitat)).length;
      expect(count).toBe(actual);
      expect(count).toBeGreaterThan(0);
    }
  });
});
