import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Species } from "@/types";
import {
  speciesInScope,
  createQuizSession,
  scopeFromLocation,
  habitatFromLocation,
  loadScopeAvailability,
} from "@/lib/quiz-session";
import { getAll } from "@/services/species.service";
import { ProgressCorruptedError } from "@/services/progress.service";

function sp(id: string, habitat: string[]): Species {
  return {
    id,
    name_korean: id,
    name_latin: id,
    name_english: id,
    order: "Passeriformes",
    family: "Fam",
    habitat,
    difficulty_tier: 1,
    abundance: "c",
    status: ["Res"],
    media: [],
    trivia: [],
  };
}

describe("speciesInScope", () => {
  const urban = sp("urban", ["도시·마을"]);
  const forest = sp("forest", ["산·숲"]);
  const river = sp("river", ["하천·호수", "도시·마을"]);
  const deps = {
    getAll: () => [urban, forest, river],
    getWeakSpecies: vi.fn((n: number) => [urban, forest].slice(0, n)),
    getDueForReview: () => [river],
  };

  it("all → 전체 카탈로그", () => {
    expect(speciesInScope({ scope: "all" }, deps)).toEqual([
      urban,
      forest,
      river,
    ]);
  });

  it("weak → getWeakSpecies(전체 종 수)로 취약종 전부", () => {
    const res = speciesInScope({ scope: "weak" }, deps);
    expect(deps.getWeakSpecies).toHaveBeenCalledWith(3);
    expect(res).toEqual([urban, forest]);
  });

  it("review → getDueForReview", () => {
    expect(speciesInScope({ scope: "review" }, deps)).toEqual([river]);
  });

  it("habitat → 해당 서식지 태그를 가진 종만", () => {
    expect(
      speciesInScope({ scope: "habitat", habitat: "도시·마을" }, deps)
    ).toEqual([urban, river]);
    expect(speciesInScope({ scope: "habitat", habitat: "산·숲" }, deps)).toEqual(
      [forest]
    );
  });

  it("habitat 미지정이면 빈 배열", () => {
    expect(speciesInScope({ scope: "habitat" }, deps)).toEqual([]);
    expect(
      speciesInScope({ scope: "habitat", habitat: null }, deps)
    ).toEqual([]);
  });

  it("매칭되는 종이 없는 서식지면 빈 배열", () => {
    expect(
      speciesInScope({ scope: "habitat", habitat: "바다" }, deps)
    ).toEqual([]);
  });
});

describe("createQuizSession", () => {
  beforeEach(() => localStorage.clear());

  it("전체 범위: include 종을 반드시 포함하고 options.scope=all", () => {
    const first = getAll()[0];
    const s = createQuizSession(first.id, "photo-to-name", "all");
    expect(s.options).toEqual({
      mode: "photo-to-name",
      scope: "all",
      size: 10,
    });
    expect(s.questions.some((q) => q.species.id === first.id)).toBe(true);
  });

  it("전체 범위 include 없음: 최대 10문제(카탈로그 크기 상한)", () => {
    const s = createQuizSession(null, "photo-to-name", "all");
    expect(s.questions.length).toBe(Math.min(10, getAll().length));
  });

  it("scope·mode 값이 options에 반영된다", () => {
    const s = createQuizSession(null, "name-to-photo", "review");
    expect(s.options.mode).toBe("name-to-photo");
    expect(s.options.scope).toBe("review");
  });

  it("좁힌 범위에서는 include 종을 강제하지 않는다(빈 복습 → 0문제)", () => {
    // 진도 없음 → review pool이 비어 있고, scope!=all이라 include도 force되지 않는다.
    const first = getAll()[0];
    const s = createQuizSession(first.id, "photo-to-name", "review");
    expect(s.questions.length).toBe(0);
  });
});

describe("scopeFromLocation / habitatFromLocation", () => {
  it("?scope= 지원값을 읽고, 미지정·미지원은 all로 폴백", () => {
    window.history.pushState({}, "", "/quiz?scope=weak");
    expect(scopeFromLocation()).toBe("weak");
    window.history.pushState({}, "", "/quiz?scope=habitat");
    expect(scopeFromLocation()).toBe("habitat");
    window.history.pushState({}, "", "/quiz?scope=bogus");
    expect(scopeFromLocation()).toBe("all");
    window.history.pushState({}, "", "/quiz");
    expect(scopeFromLocation()).toBe("all");
  });

  it("?habitat= 값을 읽고, 없으면 null", () => {
    window.history.pushState(
      {},
      "",
      "/quiz?scope=habitat&habitat=" + encodeURIComponent("도시·마을")
    );
    expect(habitatFromLocation()).toBe("도시·마을");
    window.history.pushState({}, "", "/quiz");
    expect(habitatFromLocation()).toBeNull();
  });
});

describe("loadScopeAvailability", () => {
  it("취약/복습 카운트와 서식지 목록을 함께 반환한다", () => {
    const deps = {
      getAll: () => [sp("a", ["도시·마을"]), sp("b", ["산·숲"])],
      getWeakSpecies: (n: number) => [sp("a", [])].slice(0, n),
      getDueForReview: () => [] as Species[],
    };
    const a = loadScopeAvailability(deps);
    expect(a.weak).toBe(1);
    expect(a.review).toBe(0);
    // habitats는 실제 카탈로그(getHabitats) — {habitat, count} 형태
    expect(a.habitats.length).toBeGreaterThan(0);
    expect(a.habitats[0]).toHaveProperty("habitat");
    expect(a.habitats[0]).toHaveProperty("count");
  });

  it("진도 손상 시 취약/복습은 0으로 폴백하고 서식지는 유지한다", () => {
    const corrupt = {
      getWeakSpecies: () => {
        throw new ProgressCorruptedError();
      },
      getDueForReview: () => {
        throw new ProgressCorruptedError();
      },
    };
    const a = loadScopeAvailability(corrupt);
    expect(a.weak).toBe(0);
    expect(a.review).toBe(0);
    expect(a.habitats.length).toBeGreaterThan(0);
  });
});
