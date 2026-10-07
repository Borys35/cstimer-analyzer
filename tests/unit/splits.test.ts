import { describe, it, expect } from "vitest";
import {
  extractPhases,
  analyzeSplits,
  DEFAULT_CFOP_CONFIG,
  DEFAULT_ROUX_CONFIG,
  type PhaseConfig,
} from "@/lib/splits";
import type { Solve } from "@/lib/types";

function solveWithSplits(splits: number[], timeMs: number): Solve {
  return {
    timeMs,
    dnf: false,
    penalty: 0,
    scramble: "R U R' U'",
    dateSec: 1700000000,
    splits,
  };
}

describe("extractPhases", () => {
  it("extracts 4-phase CFOP milestones correctly", () => {
    // csTimer stores milestones in reverse order: [m3, m2, m1]
    // cross ends at 2000, F2L at 8000, OLL at 12000, total time 16000
    const s = solveWithSplits([12000, 8000, 2000], 16000);
    const result = extractPhases(s);
    expect(result).not.toBeNull();
    expect(result!.phases).toEqual([
      { label: "Cross", ms: 2000 },
      { label: "F2L", ms: 6000 },
      { label: "OLL", ms: 4000 },
      { label: "PLL", ms: 4000 },
    ]);
  });

  it("extracts custom Roux labels for 4-phase splits", () => {
    const s = solveWithSplits([11000, 8000, 3000], 15000);
    const result = extractPhases(s, DEFAULT_ROUX_CONFIG.labels);
    expect(result).not.toBeNull();
    expect(result!.phases).toEqual([
      { label: "First Block", ms: 3000 },
      { label: "Second Block", ms: 5000 },
      { label: "CMLL", ms: 3000 },
      { label: "LSE", ms: 4000 },
    ]);
  });

  it("returns null for DNF or invalid splits order", () => {
    const dnfSolve: Solve = { ...solveWithSplits([1000, 2000, 3000], 4000), dnf: true };
    expect(extractPhases(dnfSolve)).toBeNull();

    // Invalid non-increasing milestones
    const badMilestones = solveWithSplits([1000, 5000, 3000], 4000);
    expect(extractPhases(badMilestones)).toBeNull();
  });
});

describe("analyzeSplits", () => {
  it("returns empty stats when under MIN_SPLIT_SOLVES", () => {
    const solves = Array.from({ length: 10 }, () =>
      solveWithSplits([12000, 8000, 2000], 16000),
    );
    const stats = analyzeSplits(solves, 16000);
    expect(stats.usableCount).toBe(10);
    expect(stats.shares).toBeNull();
    expect(stats.worst).toBeNull();
  });

  it("calculates median shares and identifies worst phase above reference", () => {
    // 30 solves where F2L takes 70% of the solve (reference is 50%)
    // Cross: 1000 (10%), F2L: 7000 (70%), OLL: 1000 (10%), PLL: 1000 (10%), total: 10000
    const solves = Array.from({ length: 30 }, () =>
      solveWithSplits([9000, 8000, 1000], 10000),
    );
    const stats = analyzeSplits(solves, 10000);
    expect(stats.usableCount).toBe(30);
    expect(stats.shares).not.toBeNull();
    expect(stats.shares!["F2L"]).toBeCloseTo(0.7, 2);
    expect(stats.worst).not.toBeNull();
    expect(stats.worst!.label).toBe("F2L");
    expect(stats.worst!.excessMs).toBeGreaterThan(0);
  });
});
