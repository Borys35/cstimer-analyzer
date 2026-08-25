import type { Solve } from "./types";
import {
  dailyBuckets,
  projectForward,
  rollingAverage,
  trendPoints,
  weeklyBuckets,
  type BucketMode,
} from "./stats";

export interface ChartRow {
  t: number;
  raw?: number;
  ao5?: number;
  ao12?: number;
  ao100?: number;
  trend?: number;
  proj?: number;
  vol?: number;
}

export interface BuildChartRowsInput {
  kept: Solve[];
  clean: Solve[];
  bucket: BucketMode;
  trend: Parameters<typeof trendPoints>[0];
  horizonWeeks: number;
  lastDateMs: number;
}

export function buildChartRows(input: BuildChartRowsInput): ChartRow[] {
  const { kept, clean, bucket } = input;
  const ao5 = rollingAverage(clean, 5);
  const ao12 = rollingAverage(clean, 12);
  const ao100 = rollingAverage(clean, 100);

  const rows = new Map<number, ChartRow>();
  const rowAt = (t: number): ChartRow => {
    let r = rows.get(t);
    if (!r) {
      r = { t };
      rows.set(t, r);
    }
    return r;
  };
  for (const s of kept) {
    if (!s.dnf) rowAt(s.dateSec * 1000).raw = s.timeMs;
  }
  for (const p of ao5) rowAt(p.t).ao5 = p.ms;
  for (const p of ao12) rowAt(p.t).ao12 = p.ms;
  for (const p of ao100) rowAt(p.t).ao100 = p.ms;

  const volBuckets = (
    bucket === "day" ? dailyBuckets(clean) : weeklyBuckets(clean)
  ).map((b) => ({ t: "dayStartMs" in b ? b.dayStartMs : b.weekStartMs, count: b.count }));
  for (const b of volBuckets) {
    rowAt(b.t).vol = b.count;
  }

  const days = dailyBuckets(clean);
  for (const p of trendPoints(input.trend, days)) rowAt(p.t).trend = p.ms;
  for (const p of projectForward(input.trend, input.lastDateMs, input.horizonWeeks)) {
    rowAt(p.t).proj = p.ms;
  }
  return [...rows.values()].sort((x, y) => x.t - y.t);
}
