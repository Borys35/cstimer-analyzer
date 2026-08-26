import { describe, it, expect } from "vitest";
import { analyze } from "@/lib/stats";
import { prescribe, drillHint } from "@/lib/prescriptions";
import type { Solve } from "@/lib/types";
import type { SplitStats } from "@/lib/splits";

const NOW = Date.UTC(2026, 7, 26);

function evidenceFixture(levelMs: number, cvTimes: number[]) {
  const clean: Solve[] = cvTimes.map((ms, i) => ({
    timeMs: ms,
    dnf: false,
    penalty: 0,
    scramble: "R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' U2",
    dateSec: (NOW - (cvTimes.length - i) * 600) / 1000,
    splits: [],
  }));
  const analysis = analyze({ rangedClean: clean, allClean: clean, nowMs: NOW });
  return {
    analysis,
    last50Times: analysis.lastNTimes.length ? analysis.lastNTimes : cvTimes,
    splits: { usableCount: 0, shares: null, worst: null } as SplitStats,
    event: "3x3",
  };
}

describe("prescriptions", () => {
  it("deterministic for identical evidence", () => {
    const times = Array.from({ length: 40 }, (_, i) => 20000 + (i % 8) * 400);
    const e = evidenceFixture(21000, times);
    expect(JSON.stringify(prescribe("Consistency", e))).toBe(
      JSON.stringify(prescribe("Consistency", e)),
    );
  });

  it("drillHint returns a single cheap hint without estimate math", () => {
    const times = Array.from({ length: 40 }, (_, i) => 20000 + (i % 6) * 500);
    const e = evidenceFixture(22000, times);
    const hint = drillHint("Improvement", e);
    expect(Object.keys(hint).sort()).toEqual(["name", "why"]);
  });

  it("consistency estimate quotes spread cost from own data", () => {
    const times = [18000, 18200, 17900, 18100, 26000];
    const e = evidenceFixture(19600, [...times, ...times, ...times]);
    const p = prescribe("Consistency", e);
    expect(p.estimate).toContain("best-quartile");
  });

  it("band selection follows level", () => {
    const times = Array.from({ length: 30 }, (_, i) => 15000 + (i % 5) * 300);
    const e = evidenceFixture(15200, times);
    expect(prescribe("Improvement", e).diagnosis).toContain("efficiency margins");
  });
});
