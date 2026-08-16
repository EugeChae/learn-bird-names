import { describe, it, expect } from "vitest";
import {
  calculate,
  DEFAULT_EASINESS_FACTOR,
  MIN_EASINESS_FACTOR,
  type SRSState,
} from "@/services/srs.engine";
import type { SRSQuality, SpeciesProgress } from "@/types";

// 결정론적 테스트를 위해 고정 시각을 주입한다(UTC).
const NOW = new Date("2026-08-16T09:00:00.000Z");

/** 이전 SRS 상태 헬퍼. */
function state(ef: number, interval: number): SRSState {
  return { easiness_factor: ef, interval_days: interval };
}

describe("srs.engine · calculate", () => {
  describe("EF(난이도 계수) 업데이트", () => {
    it("q=5(완벽) → EF +0.1", () => {
      expect(calculate(state(2.5, 6), 5, NOW).easiness_factor).toBeCloseTo(2.6, 5);
    });

    it("q=4 → EF 유지", () => {
      expect(calculate(state(2.5, 6), 4, NOW).easiness_factor).toBeCloseTo(2.5, 5);
    });

    it("q=3 → EF -0.14", () => {
      expect(calculate(state(2.5, 6), 3, NOW).easiness_factor).toBeCloseTo(2.36, 5);
    });

    it("품질이 낮을수록 EF가 더 크게 떨어진다 (q=2 < q=3)", () => {
      const ef2 = calculate(state(2.5, 6), 2, NOW).easiness_factor;
      const ef3 = calculate(state(2.5, 6), 3, NOW).easiness_factor;
      expect(ef2).toBeLessThan(ef3);
    });

    it("EF 하한 1.3 보장 — 이미 1.3인데 q=0이어도 1.3 미만으로 안 떨어짐", () => {
      expect(calculate(state(1.3, 6), 0, NOW).easiness_factor).toBe(MIN_EASINESS_FACTOR);
    });

    it("q=0을 반복해도 EF는 1.3 아래로 내려가지 않는다", () => {
      let ef = 1.4;
      for (let i = 0; i < 10; i++) {
        ef = calculate(state(ef, 0), 0, NOW).easiness_factor;
      }
      expect(ef).toBe(MIN_EASINESS_FACTOR);
    });
  });

  describe("interval(복습 간격) — 품질 구간별 정책", () => {
    it("q=0(오답) → interval 0으로 초기화, 오늘 다시 복습 대상", () => {
      const r = calculate(state(2.5, 30), 0, NOW);
      expect(r.interval_days).toBe(0);
      expect(r.next_review).toBe(NOW.toISOString());
    });

    it("q=3~5(1번에 정답) 표준 증가: 새 종 0→1, 1→6, 6→EF배수(16)", () => {
      expect(calculate(state(2.5, 0), 5, NOW).interval_days).toBe(1);
      expect(calculate(state(2.5, 1), 5, NOW).interval_days).toBe(6);
      // 6 * (2.5 + 0.1) = 15.6 → round → 16
      expect(calculate(state(2.5, 6), 5, NOW).interval_days).toBe(16);
    });

    it("1~6 사이의 어중간한 간격도 표준 정답 시 6으로 승급한다", () => {
      // 소폭 증가로 3까지 온 종이 이번에 1번에 정답 → 두 번째 사다리(6)로
      expect(calculate(state(2.5, 3), 4, NOW).interval_days).toBe(6);
    });

    it("q=1,2(재시도/힌트 정답) 소폭 증가: 새 종 0→1, 성숙 6→7", () => {
      expect(calculate(state(2.5, 0), 1, NOW).interval_days).toBe(1);
      expect(calculate(state(2.5, 0), 2, NOW).interval_days).toBe(1);
      expect(calculate(state(2.5, 6), 1, NOW).interval_days).toBe(7);
      expect(calculate(state(2.5, 6), 2, NOW).interval_days).toBe(7);
    });

    it("같은 이전 상태에서 소폭 증가(q=2) < 표준 증가(q=4)", () => {
      const slight = calculate(state(2.5, 6), 2, NOW).interval_days;
      const standard = calculate(state(2.5, 6), 4, NOW).interval_days;
      expect(slight).toBeLessThan(standard);
    });

    it("소폭 증가는 항상 이전 간격보다 크다(정체 없음)", () => {
      expect(calculate(state(2.5, 10), 1, NOW).interval_days).toBeGreaterThan(10);
    });
  });

  describe("next_review 날짜 계산", () => {
    it("interval_days만큼 UTC 기준으로 더한다", () => {
      // prev 0, q=5 → 1일 뒤
      expect(calculate(state(2.5, 0), 5, NOW).next_review).toBe(
        "2026-08-17T09:00:00.000Z"
      );
      // prev 1, q=5 → 6일 뒤
      expect(calculate(state(2.5, 1), 5, NOW).next_review).toBe(
        "2026-08-22T09:00:00.000Z"
      );
    });

    it("월 경계를 정확히 넘긴다", () => {
      const endOfMonth = new Date("2026-08-31T09:00:00.000Z");
      expect(calculate(state(2.5, 0), 5, endOfMonth).next_review).toBe(
        "2026-09-01T09:00:00.000Z"
      );
    });
  });

  describe("순수성 · 견고성", () => {
    it("같은 입력 → 같은 출력 (now 주입 시 완전 결정론적)", () => {
      const a = calculate(state(2.5, 6), 3, NOW);
      const b = calculate(state(2.5, 6), 3, NOW);
      expect(a).toEqual(b);
    });

    it("quality 0~5 전 구간이 유효한 결과를 낸다", () => {
      for (let q = 0; q <= 5; q++) {
        const r = calculate(state(2.5, 6), q as SRSQuality, NOW);
        expect(r.easiness_factor).toBeGreaterThanOrEqual(MIN_EASINESS_FACTOR);
        expect(r.interval_days).toBeGreaterThanOrEqual(0);
        expect(Number.isNaN(new Date(r.next_review).getTime())).toBe(false);
      }
    });

    it("SpeciesProgress 전체 객체도 구조적으로 받는다", () => {
      const progress: SpeciesProgress = {
        correct_count: 3,
        incorrect_count: 1,
        last_seen: NOW.toISOString(),
        next_review: NOW.toISOString(),
        easiness_factor: 2.5,
        interval_days: 6,
        last_quality: 4,
      };
      expect(calculate(progress, 5, NOW).interval_days).toBe(16);
    });

    it("now 미주입 시 현재 시각 기준으로 동작한다", () => {
      const r = calculate(state(2.5, 0), 5);
      expect(r.interval_days).toBe(1);
      expect(Number.isNaN(new Date(r.next_review).getTime())).toBe(false);
    });

    it("DEFAULT_EASINESS_FACTOR는 SM-2 표준값 2.5", () => {
      expect(DEFAULT_EASINESS_FACTOR).toBe(2.5);
    });
  });
});
