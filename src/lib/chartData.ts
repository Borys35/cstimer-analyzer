import type { ParsedSession, Solve } from "./types";
import {
  dailyBuckets,
  projectForward,
  rollingAverage,
  trendPoints,
  weeklyBuckets,
  type BucketMode,
  type DayBucket,
} from "./stats";

export interface ChartRow {
  t: number;
  sessionMean?: number;
  sessionStd?: number;
  sessionCv?: number;
  sessionCount?: number;
  sessionDnf?: number;
  sessionBest?: number;
  sessionBestAo5?: number;
  sessionBestAo12?: number;
  sessionName?: string;
  sessionIsPbMean?: boolean;
  sessionIsPbSingle?: boolean;
  sessionRank?: number;
  sessionDeltaPct?: number;
  errorBar?: number[];
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
  sessions: ParsedSession[];
  days: DayBucket[];
  bucket: BucketMode;
  trend: Parameters<typeof trendPoints>[0];
  horizonWeeks: number;
  lastDateMs: number;
}

function computeSessionMean(solves: Solve[]): number | null {
  const clean = solves.filter((s) => !s.dnf);
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b.timeMs + (b.penalty > 0 ? 2000 : 0), 0) / clean.length;
}

function computeSessionStd(solves: Solve[]): number | null {
  const clean = solves.filter((s) => !s.dnf);
  if (clean.length < 2) return null;
  const times = clean.map((s) => s.timeMs + (s.penalty > 0 ? 2000 : 0));
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((a, b) => a + (b - mean) ** 2, 0) / times.length;
  return Math.sqrt(variance);
}

function computeSessionCv(solves: Solve[]): number | null {
  const clean = solves.filter((s) => !s.dnf);
  if (clean.length < 2) return null;
  const times = clean.map((s) => s.timeMs + (s.penalty > 0 ? 2000 : 0));
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  if (mean === 0) return null;
  const variance = times.reduce((a, b) => a + (b - mean) ** 2, 0) / times.length;
  return Math.sqrt(variance) / mean;
}

function computeSessionBestAo(solves: Solve[], n: number): number | null {
  const clean = solves.filter((s) => !s.dnf);
  if (clean.length < n) return null;
  let best = Infinity;
  for (let i = 0; i <= clean.length - n; i++) {
    const window = clean.slice(i, i + n);
    if (window.length < n) break;
    const dnfs = window.filter((s) => s.dnf).length;
    if (dnfs > 1) continue;
    const times = window
      .filter((s) => !s.dnf)
      .map((s) => s.timeMs + (s.penalty > 0 ? 2000 : 0));
    times.sort((a, b) => a - b);
    times.shift();
    times.pop();
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    if (mean < best) best = mean;
  }
  return best === Infinity ? null : best;
}

export function buildChartRows(input: BuildChartRowsInput): ChartRow[] {
  const { kept, clean, sessions, bucket } = input;

  const rows = new Map<number, ChartRow>();
  const rowAt = (t: number): ChartRow => {
    let r = rows.get(t);
    if (!r) {
      r = { t };
      rows.set(t, r);
    }
    return r;
  };

  const sessionRows: { t: number; mean: number }[] = [];

  for (const session of sessions) {
    const solves = session.solves;
    const mean = computeSessionMean(solves);
    if (mean === null) continue;

    const t = Math.round(
      solves.reduce((a, s) => a + s.dateSec, 0) / solves.length * 1000,
    );
    const std = computeSessionStd(solves);
    const cv = computeSessionCv(solves);
    const dnfCount = solves.filter((s) => s.dnf).length;
    const bestSingle = Math.min(...solves.filter((s) => !s.dnf).map((s) => s.timeMs));
    const bestAo5 = computeSessionBestAo(solves, 5);
    const bestAo12 = computeSessionBestAo(solves, 12);

    const row = rowAt(t);
    row.sessionMean = mean;
    row.sessionStd = std ?? undefined;
    row.sessionCv = cv ?? undefined;
    row.sessionCount = solves.length;
    row.sessionDnf = dnfCount || undefined;
    row.sessionBest = bestSingle;
    row.sessionBestAo5 = bestAo5 ?? undefined;
    row.sessionBestAo12 = bestAo12 ?? undefined;
    row.sessionName = session.meta.name || session.meta.key;

    if (std != null) {
      row.errorBar = [mean - std, mean + std];
    }

    sessionRows.push({ t, mean });
  }

  sessionRows.sort((a, b) => a.mean - b.mean);
  for (let rank = 0; rank < sessionRows.length; rank++) {
    rows.get(sessionRows[rank].t)!.sessionRank = rank + 1;
  }

  let bestMeanSoFar = Infinity;
  let bestSingleSoFar = Infinity;
  const chrono = [...sessionRows].sort((a, b) => a.t - b.t);
  for (const sr of chrono) {
    const row = rows.get(sr.t)!;
    if (sr.mean < bestMeanSoFar) {
      row.sessionIsPbMean = true;
      bestMeanSoFar = sr.mean;
    }
    if (row.sessionBest != null && row.sessionBest < bestSingleSoFar) {
      row.sessionIsPbSingle = true;
      bestSingleSoFar = row.sessionBest;
    }
  }

  const overallMean =
    sessionRows.length > 0
      ? sessionRows.reduce((a, b) => a + b.mean, 0) / sessionRows.length
      : 0;
  for (const sr of sessionRows) {
    const row = rows.get(sr.t)!;
    row.sessionDeltaPct =
      overallMean > 0 ? ((sr.mean - overallMean) / overallMean) * 100 : undefined;
  }

  const sessionMeans = sessionRows.map((r) => ({
    dateSec: r.t / 1000,
    timeMs: r.mean,
    dnf: false,
    penalty: 0,
    scramble: "",
    splits: [],
  }));
  const ao5 = rollingAverage(sessionMeans, 5);
  const ao12 = rollingAverage(sessionMeans, 12);
  const ao100 = rollingAverage(sessionMeans, 100);

  for (const p of ao5) if (isFinite(p.ms)) rowAt(p.t).ao5 = p.ms;
  for (const p of ao12) if (isFinite(p.ms)) rowAt(p.t).ao12 = p.ms;
  for (const p of ao100) if (isFinite(p.ms)) rowAt(p.t).ao100 = p.ms;

  const volBuckets = (
    bucket === "day" ? dailyBuckets(clean) : weeklyBuckets(clean)
  ).map((b) => ({ t: "dayStartMs" in b ? b.dayStartMs : b.weekStartMs, count: b.count }));
  for (const b of volBuckets) {
    rowAt(b.t).vol = b.count;
  }

  for (const p of trendPoints(input.trend, input.days)) rowAt(p.t).trend = p.ms;
  for (const p of projectForward(input.trend, input.lastDateMs, input.horizonWeeks)) {
    rowAt(p.t).proj = p.ms;
  }
  return [...rows.values()].sort((x, y) => x.t - y.t);
}
