import { describe, it, expect } from "vitest";
import validateData from "@/scripts/validate-data.js";

const { validateSpecies, isBlank } = validateData;

function media(over: Record<string, unknown> = {}) {
  return {
    url: "https://example.com/x.jpg",
    sex: "unknown",
    age: "adult",
    plumage: "unknown",
    angle: "unknown",
    license: "CC-BY-NC",
    attribution: "(c) 촬영자",
    quality_score: 2,
    ...over,
  };
}

function sp(over: Record<string, unknown> = {}) {
  return {
    id: "x",
    name_korean: "새",
    media: [media()],
    trivia: [{ content: "c", type: "ecology", trivia_source: "출처" }],
    ...over,
  };
}

describe("validate-data · isBlank", () => {
  it("빈 문자열·공백·비문자열은 blank", () => {
    expect(isBlank("")).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank("ok")).toBe(false);
  });
});

describe("validate-data · validateSpecies", () => {
  it("정상 데이터는 오류가 없다", () => {
    expect(validateSpecies([sp()])).toEqual([]);
  });

  it("attribution 빈 문자열을 잡는다", () => {
    const errs = validateSpecies([sp({ media: [media({ attribution: "" })] })]);
    expect(errs.some((e: string) => e.includes("attribution"))).toBe(true);
  });

  it("license 공백을 잡는다", () => {
    const errs = validateSpecies([sp({ media: [media({ license: "  " })] })]);
    expect(errs.some((e: string) => e.includes("license"))).toBe(true);
  });

  it("trivia_source 빈 문자열을 잡는다", () => {
    const errs = validateSpecies([
      sp({ trivia: [{ content: "c", type: "ecology", trivia_source: "" }] }),
    ]);
    expect(errs.some((e: string) => e.includes("trivia_source"))).toBe(true);
  });

  it("오류 메시지에 종 id를 포함한다", () => {
    const errs = validateSpecies([
      sp({ id: "magpie", media: [media({ attribution: "" })] }),
    ]);
    expect(errs.some((e: string) => e.includes("magpie"))).toBe(true);
  });

  it("배열이 아니면 오류를 반환한다", () => {
    expect(validateSpecies({} as unknown as unknown[]).length).toBeGreaterThan(0);
  });

  it("실제 species.json은 검증을 통과한다", async () => {
    const speciesData = (await import("@/public/data/species.json")).default;
    expect(validateSpecies(speciesData)).toEqual([]);
  });
});
