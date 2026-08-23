import { describe, it, expect } from "vitest";
import {
  getProgress,
  getAllProgress,
  updateProgress,
  getDueForReview,
  getWeakSpecies,
  getProgressSummary,
  resetAll,
  type ProgressDeps,
} from "@/services/progress.service";
import {
  ProgressCorruptedError,
  createFakeStorage,
  createLocalStorageAdapter,
  PROGRESS_STORAGE_KEY,
} from "@/lib/localStorage.adapter";
import { calculate, DEFAULT_EASINESS_FACTOR } from "@/services/srs.engine";
import type { Species, DifficultyTier, SRSQuality } from "@/types";

const NOW = new Date("2026-08-16T09:00:00.000Z");

function sp(id: string, tier: DifficultyTier = 1): Species {
  return {
    id,
    name_korean: id,
    name_latin: id,
    name_english: id,
    order: "Passeriformes",
    family: "Corvidae",
    habitat: [],
    difficulty_tier: tier,
    abundance: "c",
    status: ["Res"],
    media: [],
    trivia: [],
  };
}

const CATALOG: Species[] = [sp("magpie"), sp("crow"), sp("sparrow")];

function deps(): ProgressDeps {
  return {
    store: createLocalStorageAdapter(createFakeStorage()),
    now: NOW,
    getById: (id) => CATALOG.find((s) => s.id === id),
    getAll: () => CATALOG,
  };
}

describe("progress.service · getProgress / getAllProgress", () => {
  it("기록이 없으면 getProgress는 null, getAllProgress는 {}", () => {
    const d = deps();
    expect(getProgress("magpie", d)).toBeNull();
    expect(getAllProgress(d)).toEqual({});
  });

  it("getAllProgress는 저장본의 복사본을 돌려 외부 변이를 막는다", () => {
    const d = deps();
    updateProgress("magpie", 5, d);
    const all = getAllProgress(d);
    all.magpie.correct_count = 99;
    expect(getProgress("magpie", d)?.correct_count).toBe(1);
  });

  it("손상된 저장소를 읽으면 ProgressCorruptedError", () => {
    const storage = createFakeStorage({
      [PROGRESS_STORAGE_KEY]: "{broken",
    });
    const d: ProgressDeps = { store: createLocalStorageAdapter(storage) };
    expect(() => getAllProgress(d)).toThrow(ProgressCorruptedError);
    expect(() => getProgress("magpie", d)).toThrow(ProgressCorruptedError);
  });
});

describe("progress.service · updateProgress", () => {
  it("새 종은 DEFAULT_EF로 초기화한 뒤 SRSEngine.calculate로 next_review를 갱신한다", () => {
    const d = deps();
    updateProgress("magpie", 5, d);
    const saved = getProgress("magpie", d)!;
    const expected = calculate(
      { easiness_factor: DEFAULT_EASINESS_FACTOR, interval_days: 0 },
      5,
      NOW
    );
    expect(saved.easiness_factor).toBe(expected.easiness_factor);
    expect(saved.interval_days).toBe(expected.interval_days);
    expect(saved.next_review).toBe(expected.next_review);
    expect(saved.last_quality).toBe(5);
    expect(saved.last_seen).toBe(NOW.toISOString());
    expect(saved.correct_count).toBe(1);
    expect(saved.incorrect_count).toBe(0);
  });

  it("q=0 → 오답 카운트, interval 0, 오늘 다시 복습", () => {
    const d = deps();
    updateProgress("magpie", 5, d);
    updateProgress("magpie", 0, d);
    const saved = getProgress("magpie", d)!;
    expect(saved.incorrect_count).toBe(1);
    expect(saved.correct_count).toBe(1);
    expect(saved.interval_days).toBe(0);
    expect(saved.next_review).toBe(NOW.toISOString());
    expect(saved.last_quality).toBe(0);
  });

  it("quality 1~5는 정답 카운트를 올린다", () => {
    const d = deps();
    for (const q of [1, 2, 3, 4, 5] as SRSQuality[]) {
      updateProgress("crow", q, d);
    }
    expect(getProgress("crow", d)?.correct_count).toBe(5);
    expect(getProgress("crow", d)?.incorrect_count).toBe(0);
  });

  it("연속 갱신은 이전 SRS 상태를 입력으로 쓴다 (1→6 사다리)", () => {
    const d = deps();
    updateProgress("sparrow", 5, d); // 0 → 1
    expect(getProgress("sparrow", d)?.interval_days).toBe(1);
    updateProgress("sparrow", 5, d); // 1 → 6
    expect(getProgress("sparrow", d)?.interval_days).toBe(6);
  });

  it("같은 store면 인스턴스가 달라도 진도가 유지된다", () => {
    const store = createLocalStorageAdapter(createFakeStorage());
    updateProgress("magpie", 4, { ...deps(), store });
    expect(getProgress("magpie", { store })?.correct_count).toBe(1);
  });
});

describe("progress.service · getDueForReview", () => {
  it("next_review가 지금 이하인 종만 Species로 반환한다", () => {
    const d = deps();
    updateProgress("magpie", 0, d); // due today
    updateProgress("crow", 5, d); // due tomorrow
    const due = getDueForReview(d);
    expect(due.map((s) => s.id)).toEqual(["magpie"]);
    expect(due[0].name_korean).toBe("magpie");
  });

  it("복습일이 지나면 해당 종도 포함된다", () => {
    const d = deps();
    updateProgress("crow", 5, d); // +1일
    const later: ProgressDeps = {
      ...d,
      now: new Date("2026-08-17T09:00:00.000Z"),
    };
    expect(getDueForReview(later).map((s) => s.id)).toEqual(["crow"]);
  });

  it("카탈로그에 없는 id는 건너뛴다", () => {
    const d = deps();
    updateProgress("ghost", 0, d);
    expect(getDueForReview(d)).toEqual([]);
  });

  it("진도가 없으면 빈 배열", () => {
    expect(getDueForReview(deps())).toEqual([]);
  });
});

describe("progress.service · getWeakSpecies", () => {
  it("오답 비율 높은 순으로 정렬한다", () => {
    const d = deps();
    // magpie 2/2 = 100%
    updateProgress("magpie", 0, d);
    updateProgress("magpie", 0, d);
    // crow 1/3 ≈ 33%
    updateProgress("crow", 5, d);
    updateProgress("crow", 5, d);
    updateProgress("crow", 0, d);
    // sparrow 0/1 = 0%
    updateProgress("sparrow", 5, d);

    expect(getWeakSpecies(10, d).map((s) => s.id)).toEqual([
      "magpie",
      "crow",
      "sparrow",
    ]);
  });

  it("limit만큼만 반환한다", () => {
    const d = deps();
    updateProgress("magpie", 0, d);
    updateProgress("crow", 0, d);
    updateProgress("sparrow", 0, d);
    expect(getWeakSpecies(2, d)).toHaveLength(2);
  });

  it("시도 기록이 없으면 빈 배열", () => {
    expect(getWeakSpecies(5, deps())).toEqual([]);
  });
});

describe("progress.service · consecutive_correct", () => {
  it("정답이면 연속을 올리고 오답이면 0으로 리셋한다", () => {
    const d = deps();
    updateProgress("magpie", 5, d);
    expect(getProgress("magpie", d)?.consecutive_correct).toBe(1);
    updateProgress("magpie", 3, d);
    expect(getProgress("magpie", d)?.consecutive_correct).toBe(2);
    updateProgress("magpie", 0, d); // 오답 → 리셋
    expect(getProgress("magpie", d)?.consecutive_correct).toBe(0);
    updateProgress("magpie", 2, d); // 힌트 정답도 정답으로 카운트
    expect(getProgress("magpie", d)?.consecutive_correct).toBe(1);
  });
});

describe("progress.service · getProgressSummary", () => {
  it("학습 종 수·전체 종 수·취약 목록을 계산한다", () => {
    const d = deps();
    updateProgress("magpie", 0, d); // 오답률 100%
    updateProgress("crow", 5, d); // 오답률 0%
    const summary = getProgressSummary(d);
    expect(summary.learned).toBe(2);
    expect(summary.total).toBe(CATALOG.length); // 3
    expect(summary.weak[0].species.id).toBe("magpie");
    expect(summary.weak[0].missRate).toBe(1);
    expect(summary.weak[0].incorrect).toBe(1);
    expect(summary.weak[0].attempts).toBe(1);
  });

  it("마스터 = 연속 3회 이상 정답인 종 수", () => {
    const d = deps();
    updateProgress("magpie", 5, d);
    updateProgress("magpie", 5, d);
    updateProgress("magpie", 5, d); // 3연속 → 마스터
    updateProgress("crow", 5, d);
    updateProgress("crow", 5, d); // 2연속 → 아직 아님
    updateProgress("sparrow", 5, d);
    updateProgress("sparrow", 0, d); // 리셋됨
    expect(getProgressSummary(d).mastered).toBe(1);
  });

  it("취약 목록은 최대 10개(WEAK_LIMIT)로 제한한다", () => {
    const many = Array.from({ length: 12 }, (_, i) => sp("s" + i));
    const d: ProgressDeps = {
      store: createLocalStorageAdapter(createFakeStorage()),
      now: NOW,
      getById: (id) => many.find((s) => s.id === id),
      getAll: () => many,
    };
    for (const s of many) updateProgress(s.id, 0, d); // 전부 오답
    expect(getProgressSummary(d).weak).toHaveLength(10);
    expect(getProgressSummary(d).learned).toBe(12);
  });

  it("진도가 없으면 learned 0, mastered 0, weak []", () => {
    const summary = getProgressSummary(deps());
    expect(summary.learned).toBe(0);
    expect(summary.mastered).toBe(0);
    expect(summary.weak).toEqual([]);
    expect(summary.total).toBe(CATALOG.length);
  });
});

describe("progress.service · resetAll", () => {
  it("저장된 진도를 모두 지운다", () => {
    const d = deps();
    updateProgress("magpie", 5, d);
    updateProgress("crow", 0, d);
    resetAll(d);
    expect(getAllProgress(d)).toEqual({});
    expect(getProgress("magpie", d)).toBeNull();
    expect(getDueForReview(d)).toEqual([]);
  });
});
