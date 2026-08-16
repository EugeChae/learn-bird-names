import { describe, it, expect } from "vitest";
import {
  PROGRESS_STORAGE_KEY,
  ProgressCorruptedError,
  createFakeStorage,
  createLocalStorageAdapter,
} from "@/lib/localStorage.adapter";
import type { SpeciesProgress, UserProgress } from "@/types";

const SAMPLE: SpeciesProgress = {
  correct_count: 2,
  incorrect_count: 1,
  last_seen: "2026-08-16T09:00:00.000Z",
  next_review: "2026-08-17T09:00:00.000Z",
  easiness_factor: 2.5,
  interval_days: 1,
  last_quality: 5,
};

const ALL: UserProgress = { "pica-serica": SAMPLE };

describe("localStorage.adapter", () => {
  it("키가 없으면 빈 진도를 반환한다", () => {
    const store = createLocalStorageAdapter(createFakeStorage());
    expect(store.load()).toEqual({});
  });

  it("유효한 UserProgress JSON을 파싱한다", () => {
    const storage = createFakeStorage({
      [PROGRESS_STORAGE_KEY]: JSON.stringify(ALL),
    });
    expect(createLocalStorageAdapter(storage).load()).toEqual(ALL);
  });

  it("지정 키 learn-bird-names:progress 만 읽는다", () => {
    const storage = createFakeStorage({
      "other-app:progress": JSON.stringify(ALL),
    });
    expect(createLocalStorageAdapter(storage).load()).toEqual({});
  });

  it("save → load 왕복이 동일하다", () => {
    const store = createLocalStorageAdapter(createFakeStorage());
    store.save(ALL);
    expect(store.load()).toEqual(ALL);
  });

  it("clear 후 load는 빈 객체다", () => {
    const store = createLocalStorageAdapter(createFakeStorage());
    store.save(ALL);
    store.clear();
    expect(store.load()).toEqual({});
  });

  it("손상된 JSON이면 ProgressCorruptedError", () => {
    const storage = createFakeStorage({
      [PROGRESS_STORAGE_KEY]: "{not-json",
    });
    expect(() => createLocalStorageAdapter(storage).load()).toThrow(
      ProgressCorruptedError
    );
  });

  it("배열·null·숫자 JSON이면 ProgressCorruptedError", () => {
    for (const raw of ["[]", "null", "42", '"oops"']) {
      const storage = createFakeStorage({ [PROGRESS_STORAGE_KEY]: raw });
      expect(() => createLocalStorageAdapter(storage).load()).toThrow(
        ProgressCorruptedError
      );
    }
  });

  it("레코드 필드가 빠지거나 타입이 틀리면 ProgressCorruptedError", () => {
    const bad = {
      "pica-serica": { correct_count: 1 },
    };
    const storage = createFakeStorage({
      [PROGRESS_STORAGE_KEY]: JSON.stringify(bad),
    });
    expect(() => createLocalStorageAdapter(storage).load()).toThrow(
      ProgressCorruptedError
    );
  });

  it("last_quality가 0~5 밖이면 ProgressCorruptedError", () => {
    const bad = {
      "pica-serica": { ...SAMPLE, last_quality: 9 },
    };
    const storage = createFakeStorage({
      [PROGRESS_STORAGE_KEY]: JSON.stringify(bad),
    });
    expect(() => createLocalStorageAdapter(storage).load()).toThrow(
      ProgressCorruptedError
    );
  });

  it("ProgressCorruptedError는 안내용 메시지를 가진다", () => {
    const err = new ProgressCorruptedError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ProgressCorruptedError");
    expect(err.message).toMatch(/손상/);
  });
});
