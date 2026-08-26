import { describe, it, expect } from "vitest";
import { computeDashboardModel, pickDefaultType } from "@/lib/model";
import { parseCstimerExport } from "@/lib/parser";
import type { Solve } from "@/lib/types";
import { filterByRange, separateJunk } from "@/lib/stats";

const NOW = Date.UTC(2026, 7, 26, 12, 0, 0);

function makeSolves(specs: { dayOffset: number; timeMs: number; dnf?: boolean; penalty?: number; splits?: number[] }[]): Solve[] {
  const startSec = NOW / 1000;
  return specs.map((sp, i) => ({
    timeMs: sp.timeMs,
    dnf: sp.dnf ?? false,
    penalty: sp.dnf ? -1 : (sp.penalty ?? 0),
    scramble: "R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' U2",
    dateSec: startSec - sp.dayOffset * 86400 + i * 17,
    splits: sp.splits ?? [],
  }));
}

function fixtureData(solves: Solve[]) {
  const json = {
    session1: solves.map((s) => [
      s.splits.length ? [s.penalty, s.timeMs, ...s.splits] : [s.penalty, s.timeMs],
      s.scramble,
      "",
      s.dateSec,
    ]),
    properties: { sessionData: JSON.stringify({ "1": { name: "1", opt: {}, rank: 1 } }) },
  };
  return JSON.stringify(json);
}

describe("computeDashboardModel ordering constraints", () => {
  const recent = [
    ...Array.from({ length: 9 }, (_, i) => ({ dayOffset: i % 3, timeMs: 20000 + i * 100 })),
    { dayOffset: 1, timeMs: 400000 },
  ];

  it("junk detection uses the in-range median only", () => {
    const data = parseCstimerExport(fixtureData(makeSolves(recent)));
    const model = computeDashboardModel(data, {
      overrides: {},
      selectedType: "3x3",
      range: "all",
      bucket: "week",
      horizonWeeks: 4,
      nowMs: NOW,
    });
    expect(model.junkCount).toBe(1);
    expect(model.clean).toHaveLength(9);
  });

  it("an out-of-range monster does not suppress in-range junk detection", () => {
    const specs = [...recent, { dayOffset: 40, timeMs: 500000 }];
    const data = parseCstimerExport(fixtureData(makeSolves(specs)));
    const model90 = computeDashboardModel(data, {
      overrides: {},
      selectedType: "3x3",
      range: "30",
      bucket: "week",
      horizonWeeks: 4,
      nowMs: NOW,
    });
    expect(model90.junkCount).toBe(1);
    const modelAll = computeDashboardModel(data, {
      overrides: {},
      selectedType: "3x3",
      range: "all",
      bucket: "week",
      horizonWeeks: 4,
      nowMs: NOW,
    });
    expect(modelAll.junkCount).toBe(2);
  });

  it("DNFs are excluded from clean but counted, and survive separateJunk", () => {
    const specs = [
      ...Array.from({ length: 8 }, (_, i) => ({ dayOffset: i % 4, timeMs: 21000 })),
      { dayOffset: 2, timeMs: 22000, dnf: true },
    ];
    const solves = makeSolves(specs);
    const kept = separateJunk(filterByRange(solves, "all", NOW)).kept;
    expect(kept.some((s) => s.dnf)).toBe(true);
    const data = parseCstimerExport(fixtureData(solves));
    const model = computeDashboardModel(data, {
      overrides: {},
      selectedType: "3x3",
      range: "all",
      bucket: "week",
      horizonWeeks: 4,
      nowMs: NOW,
    });
    expect(model.clean).toHaveLength(8);
    expect(model.dnfInRange).toBe(1);
  });

  it("trend rows exist whenever the analysis produced a trend (regression 569e434)", () => {
    const specs = Array.from({ length: 30 }, (_, d) =>
      Array.from({ length: 6 }, (_, i) => ({
        dayOffset: d,
        timeMs: 24000 - d * 60 + i * 40,
      })),
    ).flat();
    const data = parseCstimerExport(fixtureData(makeSolves(specs)));
    const model = computeDashboardModel(data, {
      overrides: {},
      selectedType: "3x3",
      range: "all",
      bucket: "week",
      horizonWeeks: 4,
      nowMs: NOW,
    });
    expect(model.analysis.trend).not.toBeNull();
    const trendRows = model.chartRows.filter((r) => typeof r.trend === "number");
    expect(trendRows.length).toBeGreaterThanOrEqual(30);
    expect(model.report.focus.some((f) => f.isWeak)).toBe(true);
  });

  it("analysis evidence flows to coach without caller recomputation", () => {
    const specs = Array.from({ length: 60 }, (_, i) => ({
      dayOffset: Math.floor(i / 5),
      timeMs: 23000 - i * 30,
    }));
    const data = parseCstimerExport(fixtureData(makeSolves(specs)));
    const model = computeDashboardModel(data, {
      overrides: {},
      selectedType: "3x3",
      range: "all",
      bucket: "week",
      horizonWeeks: 4,
      nowMs: NOW,
    });
    expect(model.analysis.lastNTimes.length).toBeLessThanOrEqual(50);
    expect(model.analysis.days.length).toBeGreaterThan(0);
    expect(model.bestSingleMs).toBeGreaterThan(0);
  });
});

describe("pickDefaultType", () => {
  it("selects the event with the most solves", () => {
    const t = NOW / 1000;
    const text = JSON.stringify({
      sessionA: [[[0, 20000], "s c r a m b l e s", "", t]],
      sessionB: [
        [[0, 20000], "s c r a m b l e s", "", t],
        [[0, 21000], "s c r a m b l e s", "", t + 1],
        [[0, 22000], "s c r a m b l e s", "", t + 2],
      ],
      properties: { sessionData: "{}" },
    });
    expect(pickDefaultType(parseCstimerExport(text))).toBe("2x2");
  });
});
