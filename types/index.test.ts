import { describe, it, expect } from "vitest";
import type { Species, SpeciesMedia, SpeciesTrivia } from "./index";

describe("Types smoke test", () => {
  it("Species object conforms to type", () => {
    const media: SpeciesMedia = {
      url: "https://example.com/photo.jpg",
      sex: "male",
      age: "adult",
      plumage: "breeding",
      angle: "perched",
      license: "CC BY-NC 4.0",
      attribution: "© Test User / iNaturalist",
      quality_score: 2,
    };

    const trivia: SpeciesTrivia = {
      content: "까치는 한국의 국조(國鳥)입니다.",
      type: "ecology",
      trivia_source: "국립생태원 한국의 새",
    };

    const species: Species = {
      id: "pica-pica",
      name_korean: "까치",
      name_latin: "Pica pica",
      name_english: "Eurasian Magpie",
      order: "참새목",
      family: "까마귀과",
      habitat: ["도심", "농경지"],
      difficulty_tier: 1,
      abundance: "ab",
      status: ["Res"],
      media: [media],
      trivia: [trivia],
    };

    expect(species.id).toBe("pica-pica");
    expect(species.abundance).toBe("ab");
    expect(species.status).toContain("Res");
    expect(species.media[0].attribution).toBeTruthy();
    expect(species.trivia[0].trivia_source).toBeTruthy();
  });

  it("trivia_source must be a non-empty string to satisfy type", () => {
    const trivia: SpeciesTrivia = {
      content: "테스트 트리비아",
      type: "seasonal",
      trivia_source: "출처 있음",
    };
    expect(trivia.trivia_source.length).toBeGreaterThan(0);
  });
});
