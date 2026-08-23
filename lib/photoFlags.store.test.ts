import { describe, it, expect } from "vitest";
import {
  getFlags,
  isFlagged,
  flagPhoto,
  unflagPhoto,
  toggleFlag,
  clearFlags,
  createFlagStore,
  PHOTO_FLAGS_STORAGE_KEY,
  type FlagDeps,
} from "@/lib/photoFlags.store";
import { createFakeStorage } from "@/lib/localStorage.adapter";

const NOW = new Date("2026-08-23T09:00:00.000Z");

function deps(): FlagDeps {
  return { store: createFlagStore(createFakeStorage()), now: NOW };
}

const MAGPIE = {
  speciesId: "pica-serica",
  nameKorean: "까치",
  photoUrl: "https://example.com/magpie.jpg",
};
const SPARROW = {
  speciesId: "passer-montanus",
  nameKorean: "참새",
  photoUrl: "https://example.com/sparrow.jpg",
};

describe("photoFlags.store · 조회", () => {
  it("기록이 없으면 getFlags는 빈 배열, isFlagged는 false", () => {
    const d = deps();
    expect(getFlags(d)).toEqual([]);
    expect(isFlagged(MAGPIE.photoUrl, d)).toBe(false);
  });
});

describe("photoFlags.store · flagPhoto", () => {
  it("플래그를 추가하고 flaggedAt에 주입된 now를 기록한다", () => {
    const d = deps();
    flagPhoto(MAGPIE, d);
    const flags = getFlags(d);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject(MAGPIE);
    expect(flags[0].flaggedAt).toBe(NOW.toISOString());
    expect(isFlagged(MAGPIE.photoUrl, d)).toBe(true);
  });

  it("같은 photoUrl은 중복 저장하지 않는다", () => {
    const d = deps();
    flagPhoto(MAGPIE, d);
    flagPhoto(MAGPIE, d);
    expect(getFlags(d)).toHaveLength(1);
  });

  it("서로 다른 사진은 함께 쌓인다", () => {
    const d = deps();
    flagPhoto(MAGPIE, d);
    flagPhoto(SPARROW, d);
    expect(getFlags(d).map((f) => f.speciesId)).toEqual([
      "pica-serica",
      "passer-montanus",
    ]);
  });
});

describe("photoFlags.store · unflag / toggle / clear", () => {
  it("unflagPhoto는 해당 사진만 제거한다", () => {
    const d = deps();
    flagPhoto(MAGPIE, d);
    flagPhoto(SPARROW, d);
    unflagPhoto(MAGPIE.photoUrl, d);
    expect(getFlags(d).map((f) => f.photoUrl)).toEqual([SPARROW.photoUrl]);
  });

  it("toggleFlag는 없으면 켜고 있으면 끈다", () => {
    const d = deps();
    const on = toggleFlag(MAGPIE, d);
    expect(on.flagged).toBe(true);
    expect(isFlagged(MAGPIE.photoUrl, d)).toBe(true);
    const off = toggleFlag(MAGPIE, d);
    expect(off.flagged).toBe(false);
    expect(isFlagged(MAGPIE.photoUrl, d)).toBe(false);
  });

  it("clearFlags는 전부 비운다", () => {
    const d = deps();
    flagPhoto(MAGPIE, d);
    flagPhoto(SPARROW, d);
    clearFlags(d);
    expect(getFlags(d)).toEqual([]);
  });
});

describe("photoFlags.store · 손상 데이터는 관대하게 처리(플래그는 비필수)", () => {
  it("깨진 JSON이면 예외 없이 빈 배열", () => {
    const store = createFlagStore(
      createFakeStorage({ [PHOTO_FLAGS_STORAGE_KEY]: "{broken" })
    );
    expect(getFlags({ store })).toEqual([]);
  });

  it("배열이 아니면 빈 배열", () => {
    const store = createFlagStore(
      createFakeStorage({ [PHOTO_FLAGS_STORAGE_KEY]: '{"a":1}' })
    );
    expect(getFlags({ store })).toEqual([]);
  });

  it("형식이 어긋난 항목은 걸러낸다", () => {
    const bad = JSON.stringify([
      { speciesId: "x", nameKorean: "엑스", photoUrl: "u", flaggedAt: "t" },
      { speciesId: "", photoUrl: "" },
      42,
    ]);
    const store = createFlagStore(
      createFakeStorage({ [PHOTO_FLAGS_STORAGE_KEY]: bad })
    );
    expect(getFlags({ store })).toHaveLength(1);
  });
});
