"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { parseCstimerExport } from "@/lib/parser";
import type { ParseResult, ParsedSession, PuzzleType } from "@/lib/types";
import {
  analyze,
  dailyBuckets,
  filterByRange,
  fmtTime,
  projectForward,
  rollingAverage,
  separateJunk,
  weeklyBuckets,
  type BucketMode,
  type RangeKey,
} from "@/lib/stats";
import { buildCoachReport, projectionSentence } from "@/lib/coach";

const PUZZLE_TYPES: PuzzleType[] = [
  "2x2",
  "3x3",
  "4x4",
  "5x5",
  "6x6",
  "7x7",
  "Pyraminx",
  "Megaminx",
  "Skewb",
  "Square-1",
  "Clock",
  "Unknown",
];

const TIER_COLOR: Record<string, string> = {
  good: "#34d399",
  decent: "#facc15",
  bad: "#fb923c",
  horrible: "#f87171",
};

function fmtDay(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(ms);
}

interface ChartRow {
  t: number;
  raw?: number;
  ao5?: number;
  ao12?: number;
  ao100?: number;
  proj?: number;
  vol?: number;
}

export default function Dashboard() {
  const [data, setData] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, PuzzleType>>({});
  const [selectedType, setSelectedType] = useState<string>("3x3");
  const [range, setRange] = useState<RangeKey>("all");
  const [bucket, setBucket] = useState<BucketMode>("week");
  const [horizon, setHorizon] = useState(4);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCstimerExport(text);
      if (parsed.sessions.length === 0) throw new Error("no sessions found");
      setData(parsed);
      setFileName(file.name);
      setError(null);
      const totals = new Map<string, number>();
      for (const s of parsed.sessions) {
        totals.set(s.puzzleType, (totals.get(s.puzzleType) ?? 0) + s.solves.length);
      }
      let best = "";
      let bestN = -1;
      for (const [t, n] of totals) if (n > bestN) [best, bestN] = [t, n];
      setSelectedType(best);
      setOverrides({});
      setRange("all");
    } catch {
      setError("Could not parse that file. Export again from cstimer: Options → Export (.txt).");
    }
  }, []);

  const effectiveType = useCallback(
    (s: ParsedSession): PuzzleType => overrides[s.meta.key] ?? s.puzzleType,
    [overrides],
  );

  const derived = useMemo(() => {
    if (!data) return null;
    const byType = new Map<string, { count: number; sessions: ParsedSession[] }>();
    for (const s of data.sessions) {
      const t = effectiveType(s);
      const e = byType.get(t) ?? { count: 0, sessions: [] };
      e.count += s.solves.length;
      e.sessions.push(s);
      byType.set(t, e);
    }
    const typeOptions = [...byType.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([label, v]) => ({ label, count: v.count }));

    const active = byType.get(selectedType)?.sessions ?? [];
    const merged = active
      .flatMap((s) => s.solves)
      .sort((a, b) => a.dateSec - b.dateSec);
    const rangedAll = filterByRange(merged, range);
    const { kept, junk } = separateJunk(rangedAll);
    const clean = kept.filter((s) => !s.dnf);

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

    const chartRows = [...rows.values()].sort((a, b) => a.t - b.t);

    const analysis = analyze({
      rangedClean: clean,
      allClean: merged.filter((s) => !s.dnf),
      rangedAll: kept,
    });
    const lastT = clean.length ? clean[clean.length - 1].dateSec * 1000 : Date.now();
    const projection = projectForward(analysis.trend, lastT, horizon);
    const fullRows = [...chartRows];
    for (const p of projection) {
      if (!fullRows.some((r) => r.t === p.t)) fullRows.push({ t: p.t, proj: p.ms });
    }
    fullRows.sort((x, y) => x.t - y.t);

    const report = buildCoachReport(analysis, selectedType);
    const projSentence = projectionSentence(analysis, horizon);

    return {
      typeOptions,
      merged,
      clean,
      junkCount: junk.length,
      dnfInRange: kept.length - clean.length,
      chartRows: fullRows,
      analysis,
      report,
      projSentence,
      bestSingle: clean.length ? Math.min(...clean.map((s) => s.timeMs)) : null,
    };
  }, [data, effectiveType, selectedType, range, bucket, horizon]);

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">cstimer analyzer</h1>
        <p className="mb-8 text-sm text-zinc-400">
          Upload a cstimer export. It will be graded without mercy.
        </p>
        <div
          className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragging ? "border-zinc-300 bg-zinc-800" : "border-zinc-700 hover:border-zinc-500"
          }`}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void loadFile(f);
          }}
        >
          <p className="text-zinc-300">Drop your cstimer .txt export here</p>
          <p className="mt-1 text-xs text-zinc-500">or click to browse — nothing leaves your machine</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".txt,.json,application/json,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void loadFile(f);
            e.target.value = "";
          }}
        />
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </main>
    );
  }

  const d = derived!;
  const a = d.analysis;
  const subscoreBar = (label: string, score: number | null, weight: string) => (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-zinc-200">{label}</span>
        <span className="text-zinc-400">
          {score != null ? `${score}/100` : "n/a"}{" "}
          <span className="text-xs text-zinc-600">({weight})</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${score == null ? "bg-zinc-700" : score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-yellow-400" : score >= 40 ? "bg-orange-400" : "bg-red-500"}`}
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">cstimer analyzer</h1>
          <p className="text-xs text-zinc-500">
            {fileName} · everything analyzed locally in your browser
          </p>
        </div>
        <button
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500"
          onClick={() => {
            setData(null);
            setError(null);
          }}
        >
          Change file
        </button>
      </header>

      <section className="mb-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Event
          <select
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {d.typeOptions.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label} ({t.count} solves)
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Range
          <select
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
          >
            <option value="all">All time</option>
            <option value="90">Last 90 days</option>
            <option value="30">Last 30 days</option>
            <option value="7">Last 7 days</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Volume buckets
          <select
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={bucket}
            onChange={(e) => setBucket(e.target.value as BucketMode)}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Projection horizon
          <select
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
          >
            <option value={1}>+1 week</option>
            <option value={2}>+2 weeks</option>
            <option value={4}>+4 weeks</option>
            <option value={8}>+8 weeks</option>
          </select>
        </label>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Solves in range", String(d.clean.length)],
          ["DNFs in range", String(d.dnfInRange)],
          ["Abandoned ignored", String(d.junkCount)],
          ["Current level", d.analysis.currentLevelMs != null ? fmtTime(d.analysis.currentLevelMs) : "—"],
          ["Best single", d.bestSingle != null ? fmtTime(d.bestSingle) : "—"],
          [
            "Active days / 14",
            `${d.analysis.freq.activeDays} @ ${d.analysis.freq.solvesPerActiveDay.toFixed(0)}/d`,
          ],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">{k}</div>
            <div className="mt-1 font-mono text-lg">{v}</div>
          </div>
        ))}
      </section>

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={d.chartRows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#27272a" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={fmtDay}
              stroke="#71717a"
              fontSize={11}
            />
            <YAxis
              yAxisId="time"
              reversed
              domain={["auto", "auto"]}
              tickFormatter={(ms: number) => fmtTime(ms)}
              stroke="#71717a"
              fontSize={11}
              width={64}
            />
            <YAxis yAxisId="vol" orientation="right" stroke="#3f3f46" fontSize={11} width={32} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(t) => fmtDay(Number(t))}
              formatter={(value, name) =>
                name === "Volume" ? [`${value} solves`, name] : [fmtTime(Number(value)), name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="vol" dataKey="vol" name="Volume" fill="#3f3f46" opacity={0.5} barSize={14} />
            <Scatter yAxisId="time" dataKey="raw" name="Solve" fill="#a1a1aa" fillOpacity={0.55} />
            <Line
              yAxisId="time"
              type="linear"
              dataKey="ao5"
              name="ao5"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={1}
            />
            <Line
              yAxisId="time"
              type="linear"
              dataKey="ao12"
              name="ao12"
              stroke="#818cf8"
              dot={false}
              strokeWidth={1.5}
            />
            <Line
              yAxisId="time"
              type="linear"
              dataKey="ao100"
              name="ao100"
              stroke="#34d399"
              dot={false}
              strokeWidth={2.5}
            />
            <Line
              yAxisId="time"
              type="linear"
              dataKey="proj"
              name="Projection"
              stroke="#f87171"
              strokeDasharray="6 4"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-[11px] text-zinc-600">
          vertical axis inverted — higher is faster
        </p>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500">Headline score</div>
          <div className="mt-2 flex items-baseline gap-3">
            <span
              className="font-mono text-6xl font-bold"
              style={{ color: a.headline != null ? TIER_COLOR[a.tier ?? "bad"] : "#71717a" }}
            >
              {a.headline ?? "—"}
            </span>
            <span className="text-zinc-500">/100</span>
          </div>
          <div className="mt-3 space-y-3">
            {subscoreBar("Improvement", a.subscores.improvement, "40%")}
            {subscoreBar("Consistency", a.subscores.consistency, "30%")}
            {subscoreBar("Frequency", a.subscores.frequency, "30%")}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-3">
          <div
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: a.tier ? TIER_COLOR[a.tier] : "#71717a" }}
          >
            {d.report.verdictTitle}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{d.report.verdictText}</p>
          {d.projSentence && (
            <p className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-sm leading-relaxed text-zinc-400">
              {d.projSentence}
            </p>
          )}
        </div>
      </section>

      <section className="mb-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Where you are losing points — worst first
        </h2>
        {d.report.focus.map((f) => (
          <div key={f.area} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-1 flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-200">{f.area}</span>
              {f.score != null && (
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-xs"
                  style={{
                    color: f.score >= 80 ? "#34d399" : f.score >= 60 ? "#facc15" : f.score >= 40 ? "#fb923c" : "#f87171",
                    background: "#1c1c1f",
                  }}
                >
                  {f.score}/100
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{f.text}</p>
          </div>
        ))}
      </section>

      <details className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
        <summary className="cursor-pointer text-zinc-300">
          Sessions ({data.sessions.length}) — fix auto-detected event types here
        </summary>
        <div className="mt-3 divide-y divide-zinc-800">
          {data.sessions.map((s) => (
            <div key={s.meta.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <span className="w-20 font-mono text-xs text-zinc-500">{s.meta.key}</span>
              <span className="min-w-40 flex-1 truncate text-xs text-zinc-400">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                  timeZone: "UTC",
                }).format(s.meta.firstDateSec * 1000)}{" "}
                · {s.meta.solveCount} solves
              </span>
              <span className="text-xs text-zinc-600">{s.typeSource}</span>
              <select
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
                value={effectiveType(s)}
                onChange={(e) =>
                  setOverrides((o) => ({ ...o, [s.meta.key]: e.target.value as PuzzleType }))
                }
              >
                {PUZZLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                    {overrides[s.meta.key] === undefined ? ` (auto: ${s.puzzleType})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </details>
    </main>
  );
}
