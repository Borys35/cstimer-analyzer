import { describe, it, expect } from "vitest";
import {
  computeHistogram,
  computeTimeOfDay,
  compareSessions,
} from "@/lib/analytics";
import type { ParsedSession, Solve } from "@/lib/types";

function makeSolve(timeMs: number, dnf = false, hour = 12): Solve {
  // 2026-08-26 12:00:00 UTC
  const base = new Date(2026, 7, 26, hour, 0, 0).getTime() / 1000;
  return {
    timeMs,
    dnf,
    penalty: 0,
    scramble: "R U R' U'",
    dateSec: base,
    splits: [],
  };
}

describe("computeHistogram", () => {
  it("returns null for fewer than 3 times", () => {
    expect(computeHistogram([10000, 12000])).toBeNull();
  });

  it("bins times into auto-scaled ranges and computes stats", () => {
    const times = [
      10000, 10500, 10800,
      11200, 11500, 11900,
      12100, 12400, 13000,
      14000, 15000,
    ];
    const res = computeHistogram(times);
    expect(res).not.toBeNull();
    expect(res!.bins.length).toBeGreaterThan(0);
    const totalCount = res!.bins.reduce((a, b) => a + b.count, 0);
    expect(totalCount).toBe(times.length);
    expect(res!.meanMs).toBeCloseTo(12036, 0);
    expect(res!.medianMs).toBe(11900);
  });
});

describe("computeTimeOfDay", () => {
  it("groups solves by hour and finds peak hour", () => {
    const solves: Solve[] = [
      // 3 fast solves at hour 14
      makeSolve(9000, false, 14),
      makeSolve(9200, false, 14),
      makeSolve(9100, false, 14),
      // 3 slower solves at hour 20
      makeSolve(15000, false, 20),
      makeSolve(15500, false, 20),
      makeSolve(16000, false, 20),
    ];
    const res = computeTimeOfDay(solves);
    expect(res.hours).toHaveLength(24);
    expect(res.hours[14].solveCount).toBe(3);
    expect(res.hours[20].solveCount).toBe(3);
    expect(res.peakHour).toBe(14);
    expect(res.peakLabel).toContain("14:00");
  });
});

describe("compareSessions", () => {
  it("compares multiple sessions side by side", () => {
    const s1: ParsedSession = {
      meta: {
        key: "s1",
        name: "Morning Practice",
        solveCount: 5,
        firstDateSec: 1000,
        lastDateSec: 2000,
      },
      solves: [
        makeSolve(10000),
        makeSolve(11000),
        makeSolve(12000),
        makeSolve(13000),
        makeSolve(14000),
      ],
      puzzleType: "3x3",
      typeSource: "scrType",
    };

    const s2: ParsedSession = {
      meta: {
        key: "s2",
        name: "Evening Grind",
        solveCount: 5,
        firstDateSec: 3000,
        lastDateSec: 4000,
      },
      solves: [
        makeSolve(8000),
        makeSolve(8500),
        makeSolve(9000),
        makeSolve(9500),
        makeSolve(10000),
      ],
      puzzleType: "3x3",
      typeSource: "scrType",
    };

    const compared = compareSessions([s1, s2]);
    expect(compared).toHaveLength(2);
    expect(compared[0].name).toBe("Morning Practice");
    expect(compared[0].meanMs).toBe(12000);
    expect(compared[1].name).toBe("Evening Grind");
    expect(compared[1].meanMs).toBe(9000);
    expect(compared[1].bestSingleMs).toBe(8000);
  });
});
