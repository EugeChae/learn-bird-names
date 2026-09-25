import { describe, it, expect } from "vitest";
import { createFakeStorage } from "@/lib/localStorage.adapter";
import {
  createBirdOfTheDayStore,
  createMemoryBirdOfTheDayStore,
  getTodayRecord,
  getRecentSpeciesIds,
  recordBirdOfTheDay,
  countMomentView,
  getMomentViews,
  clearBirdOfTheDay,
  localDateKey,
  BIRD_OF_THE_DAY_KEY,
  MOMENT_VIEWS_KEY,
  RECENT_DAYS,
} from "./birdOfTheDay.store";

const NOW = new Date(2026, 8, 25, 9, 0); // 2026-09-25 09:00 로컬

function deps(storage = createFakeStorage()) {
  return { store: createBirdOfTheDayStore(storage), now: NOW, storage };
}

describe("birdOfTheDay.store", () => {
  it("localDateKey는 로컬 날짜 YYYY-MM-DD", () => {
    expect(localDateKey(NOW)).toBe("2026-09-25");
    expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("기록이 없으면 오늘 기록 undefined, 최근 목록 빈 배열, 열람 0", () => {
    const d = deps();
    expect(getTodayRecord(d)).toBeUndefined();
    expect(getRecentSpeciesIds(d)).toEqual([]);
    expect(getMomentViews(d)).toEqual({ dawn: 0, day: 0, dusk: 0 });
  });

  it("오늘의 새를 기록하면 오늘 기록에 잡히고, 최근 목록(오늘 제외)에는 안 잡힌다", () => {
    const d = deps();
    recordBirdOfTheDay("magpie", d);
    expect(getTodayRecord(d)).toEqual({ date: "2026-09-25", speciesId: "magpie" });
    expect(getRecentSpeciesIds(d)).toEqual([]);
  });

  it("어제·29일 전 기록은 최근에 포함, 31일 전은 제외", () => {
    const d = deps();
    const yesterday = new Date(NOW);
    yesterday.setDate(NOW.getDate() - 1);
    const d29 = new Date(NOW);
    d29.setDate(NOW.getDate() - (RECENT_DAYS - 1));
    const d31 = new Date(NOW);
    d31.setDate(NOW.getDate() - (RECENT_DAYS + 1));
    recordBirdOfTheDay("y", { ...d, now: yesterday });
    recordBirdOfTheDay("a", { ...d, now: d29 });
    recordBirdOfTheDay("old", { ...d, now: d31 });
    expect(getRecentSpeciesIds(d).sort()).toEqual(["a", "y"]);
  });

  it("같은 날 두 번 기록하면 마지막 것 하나만 남는다", () => {
    const d = deps();
    recordBirdOfTheDay("a", d);
    recordBirdOfTheDay("b", d);
    expect(d.store.loadRecords()).toEqual([{ date: "2026-09-25", speciesId: "b" }]);
  });

  it("손상된 JSON은 조용히 빈 값으로 복구한다", () => {
    const storage = createFakeStorage({
      [BIRD_OF_THE_DAY_KEY]: "{not json",
      [MOMENT_VIEWS_KEY]: '{"dawn":"x","day":-1,"dusk":2}',
    });
    const d = deps(storage);
    expect(getRecentSpeciesIds(d)).toEqual([]);
    expect(getMomentViews(d)).toEqual({ dawn: 0, day: 0, dusk: 2 });
  });

  it("순간별 열람을 센다", () => {
    const d = deps();
    countMomentView("dusk", d);
    countMomentView("dusk", d);
    countMomentView("dawn", d);
    expect(getMomentViews(d)).toEqual({ dawn: 1, day: 0, dusk: 2 });
  });

  it("clear는 기록과 열람을 모두 지운다", () => {
    const d = deps();
    recordBirdOfTheDay("a", d);
    countMomentView("day", d);
    clearBirdOfTheDay(d);
    expect(getTodayRecord(d)).toBeUndefined();
    expect(getMomentViews(d)).toEqual({ dawn: 0, day: 0, dusk: 0 });
  });

  it("메모리 저장소도 같은 계약을 지킨다", () => {
    const d = { store: createMemoryBirdOfTheDayStore(), now: NOW };
    recordBirdOfTheDay("a", d);
    countMomentView("dawn", d);
    expect(getTodayRecord(d)?.speciesId).toBe("a");
    expect(getMomentViews(d).dawn).toBe(1);
  });
});
