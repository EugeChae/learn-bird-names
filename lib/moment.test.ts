import { describe, it, expect } from "vitest";
import { momentOf, momentOfHour, isMoment, MOMENT_BOUNDS } from "./moment";

describe("moment", () => {
  it("경계값: 05시 새벽 시작, 10시 한낮 시작, 17시 해질녘 시작", () => {
    expect(momentOfHour(MOMENT_BOUNDS.dawn)).toBe("dawn");
    expect(momentOfHour(MOMENT_BOUNDS.day - 1)).toBe("dawn");
    expect(momentOfHour(MOMENT_BOUNDS.day)).toBe("day");
    expect(momentOfHour(MOMENT_BOUNDS.dusk - 1)).toBe("day");
    expect(momentOfHour(MOMENT_BOUNDS.dusk)).toBe("dusk");
  });

  it("자정 넘어 새벽 전(0~4시)은 해질녘으로 이어진다", () => {
    expect(momentOfHour(0)).toBe("dusk");
    expect(momentOfHour(4)).toBe("dusk");
    expect(momentOfHour(23)).toBe("dusk");
  });

  it("날짜 → 순간 (로컬 시각)", () => {
    expect(momentOf(new Date(2026, 8, 25, 7, 30))).toBe("dawn");
    expect(momentOf(new Date(2026, 8, 25, 13, 0))).toBe("day");
    expect(momentOf(new Date(2026, 8, 25, 19, 0))).toBe("dusk");
  });

  it("isMoment", () => {
    expect(isMoment("dawn")).toBe(true);
    expect(isMoment("noon")).toBe(false);
    expect(isMoment(undefined)).toBe(false);
  });
});
