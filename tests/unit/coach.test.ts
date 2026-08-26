import { describe, it, expect } from "vitest";
import { analyze } from "@/lib/stats";
import { buildCoachReport } from "@/lib/coach";
import type { Solve } from "@/lib/types";
import type { SplitStats } from "@/lib/splits";

const NOW = Date.UTC(2026, 7, 26);

function solves(days: number[], perDay = 6): Solve[] {
  return days.flatMap((d) =>
    Array.from({ length: perDay }, (_, i) => ({
      timeMs: 24000 - d * 60 + i * 50,
      dnf: false,
      penalty: 0,
      scramble: "R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' U2",
      dateSec: (NOW - (days[days.length - 1] - d) * 86400_000) / 1000 + i * 31,
      splits: [],
    })),
  );
}

const NO_SPLITS: SplitStats = { usableCount: 0, shares: null, worst: null };

describe("buildCoachReport", () => {
  it("marks exactly one scored axis as weak even when a Data card exists", () => {
    const clean = solves([1]);
    const analysis = analyze({ rangedClean: clean, allClean: clean, nowMs: NOW });
    expect(analysis.subscores.improvement).toBeNull();
    expect(analysis.subscores.consistency).toBeNull();
    const report = buildCoachReport({
      analysis,
      last50Times: analysis.lastNTimes,
      splits: NO_SPLITS,
      event: "3x3",
      label: "3x3",
    });
    const dataCards = report.focus.filter((f) => f.area === "Data");
    expect(dataCards.length).toBe(1);
    const weak = report.focus.filter((f) => f.isWeak);
    expect(weak).toHaveLength(1);
    expect(weak[0].area).toBe("Frequency");
    expect(report.focus[0].isWeak).toBe(true);
  });

  it("gates split hints to 3x3", () => {
    const clean = solves(Array.from({ length: 21 }, (_, i) => i));
    const analysis = analyze({ rangedClean: clean, allClean: clean, nowMs: NOW });
    for (const event of ["3x3", "2x2"]) {
      const report = buildCoachReport({
        analysis,
        last50Times: analysis.lastNTimes,
        splits: NO_SPLITS,
        event,
        label: event,
      });
      if (event === "3x3") expect(report.splitHint).toContain("multi-phase");
      else expect(report.splitHint).toBeNull();
    }
  });

  it("short ranges add a Data card but still grade from remaining axes", () => {
    const clean = solves([1], 3);
    const analysis = analyze({ rangedClean: clean, allClean: clean, nowMs: NOW });
    expect(analysis.subscores.improvement).toBeNull();
    const report = buildCoachReport({
      analysis,
      last50Times: analysis.lastNTimes,
      splits: NO_SPLITS,
      event: "3x3",
      label: "3x3",
    });
    expect(report.focus.some((f) => f.area === "Data")).toBe(true);
    expect(analysis.headline).not.toBeNull();
  });

  it("empty range produces no verdict and a Data card", () => {
    const analysis = analyze({ rangedClean: [], allClean: [], nowMs: NOW });
    const report = buildCoachReport({
      analysis,
      last50Times: [],
      splits: NO_SPLITS,
      event: "3x3",
      label: "3x3",
    });
    expect(analysis.headline).toBeNull();
    expect(report.verdictTitle).toBe("NO VERDICT YET");
    expect(report.focus.some((f) => f.area === "Data")).toBe(true);
  });
});
