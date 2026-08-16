import { describe, it, expect } from "vitest";
import speciesData from "@/public/data/species.json";
import type { Species } from "./index";

// 컴파일 타임 검증: species.json이 Species[] 타입에 부합하지 않으면 tsc/build 실패.
// trivia_source·attribution 등 필수 필드 누락 시 여기서 타입 오류가 발생한다.
const species: Species[] = speciesData;

describe("species.json 샘플 데이터 검증", () => {
  it("최소 2종 이상 존재한다", () => {
    expect(species.length).toBeGreaterThanOrEqual(2);
  });

  it("여름철새(SV)와 텃새(Res) 두 status 유형을 모두 포함한다", () => {
    const statuses = species.flatMap((s) => s.status);
    expect(statuses).toContain("SV");
    expect(statuses).toContain("Res");
  });

  it("모든 종의 id가 고유하다", () => {
    const ids = species.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 사진에 license와 attribution이 채워져 있다 (라이선스 원칙)", () => {
    for (const s of species) {
      expect(s.media.length).toBeGreaterThan(0);
      for (const m of s.media) {
        expect(m.license.trim().length).toBeGreaterThan(0);
        expect(m.attribution.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("모든 트리비아에 trivia_source가 채워져 있다 (트리비아 원칙)", () => {
    for (const s of species) {
      for (const t of s.trivia) {
        expect(t.trivia_source.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
