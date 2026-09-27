import { describe, expect, it } from "vitest";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apply, sameSeasons } = require("./moment-sheet.js");

type T = { content: string; type: string; trivia_source: string; moment?: string; seasons?: string[] };
const sp = (trivia: T[]) => [{ name_korean: "까치", trivia }];
const draft = (over: Record<string, unknown>) => ({
  species: "까치", moment: "dawn", content: "c", trivia_source: "s", ...over,
});

describe("moment-sheet apply", () => {
  it("같은 (moment, seasons)면 교체, seasons가 다르면 추가 — 겨울 문장과 봄~가을 문장은 공존", () => {
    const list = sp([{ content: "eco", type: "ecology", trivia_source: "s" }]);
    expect(apply({ items: [draft({ content: "겨울", seasons: ["winter"] })] }, list)).toEqual({ added: 1, replaced: 0, skipped: 0 });
    expect(apply({ items: [draft({ content: "봄~가을", seasons: ["spring", "summer", "autumn"] })] }, list)).toEqual({ added: 1, replaced: 0, skipped: 0 });
    expect(apply({ items: [draft({ content: "겨울2", seasons: ["winter"] })] }, list)).toEqual({ added: 0, replaced: 1, skipped: 0 });
    const dawn = list[0].trivia.filter((t) => t.moment === "dawn");
    expect(dawn.map((t) => t.content)).toEqual(["겨울2", "봄~가을"]);
  });

  it("seasons 없는 문장은 사계절 문장끼리만 교체", () => {
    const list = sp([]);
    apply({ items: [draft({ content: "늘" })] }, list);
    apply({ items: [draft({ content: "겨울", seasons: ["winter"] })] }, list);
    expect(apply({ items: [draft({ content: "늘2" })] }, list)).toEqual({ added: 0, replaced: 1, skipped: 0 });
    expect(list[0].trivia).toHaveLength(2);
  });

  it("sameSeasons는 순서·빈 배열·undefined를 같게 본다", () => {
    expect(sameSeasons(["winter", "spring"], ["spring", "winter"])).toBe(true);
    expect(sameSeasons([], undefined)).toBe(true);
    expect(sameSeasons(["winter"], undefined)).toBe(false);
  });
});
