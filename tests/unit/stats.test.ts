import { describe, it, expect } from "vitest";
import {
  analyze,
  filterByRange,
  separateJunk,
  pctPerWeek,
  fmtTime,
  LAST_N,
} from "@/lib/stats";
import type { Solve } from "@/lib/types";

const NOW = Date.UTC(2026, 7, 26);

function solve(partial: Partial<Solve>): Solve {
  return {
    timeMs: 20000,
    dnf: false,
    penalty: 0,
    scramble: "",
    dateSec: NOW / 1000,
    splits: [],
    ...partial,
  };
}

describe("filterByRange", () => {
  const solves = [
    solve({ dateSec: (NOW - 3 * 86400_000) / 1000 }),
    solve({ dateSec: (NOW - 45 * 86400_000) / 1000 }),
  ];

  it("all keeps everything", () => {
    expect(filterByRange(solves, "all", NOW)).toHaveLength(2);
  });
  it("30-day cutoff excludes older solves", () => {
    expect(filterByRange(solves, "30", NOW)).toHaveLength(1);
  });
});

describe("separateJunk", () => {
  it("flags times beyond the in-range median cap as junk", () => {
    const solves = [
      ...Array.from({ length: 9 }, (_, i) => solve({ timeMs: 20000 + i * 100 })),
      solve({ timeMs: 400000 }),
    ];
    const { kept, junk } = separateJunk(solves);
    expect(junk).toHaveLength(1);
    expect(kept).toHaveLength(9);
  });
  it("keeps DNFs for counting instead of dropping them silently", () => {
    const solves = [
      ...Array.from({ length: 5 }, (_, i) => solve({ timeMs: 20000 + i * 100 })),
      solve({ timeMs: 25000, dnf: true, penalty: -1 }),
    ];
    const { kept } = separateJunk(solves);
    expect(kept.some((s) => s.dnf)).toBe(true);
  });
  it("too-small input passes through untouched", () => {
    const solves = [solve({}), solve({})];
    expect(separateJunk(solves).junk).toHaveLength(0);
  });
});

describe("analyze evidence exposure", () => {
  it("returns lastNTimes capped at LAST_N and non-empty days", () => {
    const solves = Array.from({ length: 60 }, (_, i) =>
      solve({ timeMs: 21000 + (i % 10) * 80, dateSec: (NOW - (i % 12) * 86400_000) / 1000 }),
    );
    const result = analyze({ rangedClean: solves, allClean: solves, nowMs: NOW });
    expect(result.lastNTimes.length).toBe(LAST_N);
    expect(result.days.length).toBeGreaterThan(0);
    expect(result.currentLevelMs).not.toBeNull();
  });
});

describe("pctPerWeek", () => {
  it("positive when improving (slope negative)", () => {
    const trend = { slopeMsPerDay: -10, interceptMs: 20000, endLevelMs: 19930, weeksCovered: 4 };
    expect(pctPerWeek(trend, 20000)).toBeCloseTo(0.35, 5);
  });
});

describe("fmtTime", () => {
  it("formats sub-minute as seconds", () => {
    expect(fmtTime(12345)).toBe("12.35");
  });
  it("formats minutes with padded seconds", () => {
    expect(fmtTime(75400)).toBe("1:15.40");
  });
});
