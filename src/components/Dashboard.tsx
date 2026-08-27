"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ErrorBar,
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
import { fmtTime, type BucketMode, type RangeKey } from "@/lib/stats";
import {
  computeDashboardModel,
  effectiveTypeOf,
  pickDefaultType,
} from "@/lib/model";
import {
  applyTheme,
  nextTheme,
  readChartPalette,
  readStoredTheme,
  systemTheme,
  type ChartPalette,
  type Theme,
} from "@/lib/theme";
import ThemeToggle from "@/components/ThemeToggle";
import CubeHero from "@/components/CubeHero";

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
  good: "var(--cube-green)",
  decent: "var(--cube-yellow)",
  bad: "var(--cube-orange)",
  horrible: "var(--cube-red)",
};

const AXIS_PANEL: Record<string, string> = {
  Improvement: "panel-red",
  Consistency: "panel-blue",
  Frequency: "panel-yellow",
};

function cvColor(cv: number | undefined, palette: ChartPalette): string {
  if (cv == null) return palette.raw;
  if (cv < 0.08) return "var(--cube-green)";
  if (cv < 0.12) return "var(--cube-yellow)";
  if (cv < 0.18) return "var(--cube-orange)";
  return "var(--cube-red)";
}

function sessionDot(props: {
  cx?: number;
  cy?: number;
  payload?: Record<string, unknown>;
  palette: ChartPalette;
}) {
  const { cx, cy, payload, palette } = props;
  if (cx == null || cy == null || payload == null) return null;
  const count = (payload.sessionCount as number) ?? 1;
  const r = Math.min(Math.max(3, Math.sqrt(count) * 1.2), 11);
  const fill = cvColor(payload.sessionCv as number | undefined, palette);
  const isPb = payload.sessionIsPbMean === true;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={fill} strokeWidth={isPb ? 2.5 : 0} opacity={0.9} />
      <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.75} stroke={palette.grid} strokeWidth={0.5} />
    </g>
  );
}

function SessionTooltip(props: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
  palette: ChartPalette | null;
}) {
  const { active, payload, palette } = props;
  if (!active || !payload || !palette) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const t = d.t as number;
  const mean = d.sessionMean as number | undefined;
  const trend = d.trend as number | undefined;
  const proj = d.proj as number | undefined;

  const isSession = mean != null;
  const isTrend = !isSession && (trend != null || proj != null);

  if (isTrend) {
    const value = proj ?? trend;
    const label = proj != null ? "Projected" : "Trend";
    return (
      <div
        className="rounded-lg border px-3 py-2 text-xs leading-relaxed shadow-lg"
        style={{ background: palette.tooltipBg, borderColor: palette.grid, color: palette.tick }}
      >
        <div className="mb-1 font-semibold">
          {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit", timeZone: "UTC" }).format(t)}
        </div>
        <div>
          {label}: <span className="font-mono font-semibold">{fmtTime(value!)}</span>
        </div>
      </div>
    );
  }

  if (!isSession) return null;

  const std = d.sessionStd as number | undefined;
  const cv = d.sessionCv as number | undefined;
  const count = d.sessionCount as number | undefined;
  const dnf = d.sessionDnf as number | undefined;
  const best = d.sessionBest as number | undefined;
  const bestAo5 = d.sessionBestAo5 as number | undefined;
  const bestAo12 = d.sessionBestAo12 as number | undefined;
  const name = d.sessionName as string | undefined;
  const isPbMean = d.sessionIsPbMean === true;
  const isPbSingle = d.sessionIsPbSingle === true;
  const rank = d.sessionRank as number | undefined;
  const delta = d.sessionDeltaPct as number | undefined;

  const deltaText =
    delta != null
      ? delta < -2
        ? `${Math.abs(delta).toFixed(1)}% faster than avg`
        : delta > 2
          ? `${delta.toFixed(1)}% slower than avg`
          : "near your average"
      : null;

  const rankLabel =
    rank != null
      ? rank === 1
        ? "Best session"
        : rank <= 3
          ? `Top ${rank} session`
          : `Rank #${rank}`
      : null;

  return (
    <div
      className="rounded-lg border px-3 py-2.5 text-xs leading-relaxed shadow-lg"
      style={{
        background: palette.tooltipBg,
        borderColor: palette.grid,
        color: palette.tick,
      }}
    >
      <div className="mb-1.5 font-semibold">
        {name || "Session"}{" "}
        <span className="font-normal opacity-60">
          {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit", timeZone: "UTC" }).format(t)}
        </span>
      </div>
      <div className="space-y-0.5">
        <div>
          Mean: <span className="font-mono">{fmtTime(mean!)}</span>
          {isPbMean && <span className="ml-1.5 rounded bg-green-500/20 px-1 py-0.5 text-[10px] font-medium text-green-400">PB</span>}
        </div>
        <div>
          Best single: <span className="font-mono">{best != null ? fmtTime(best) : "—"}</span>
          {isPbSingle && <span className="ml-1.5 rounded bg-green-500/20 px-1 py-0.5 text-[10px] font-medium text-green-400">PB</span>}
        </div>
        {bestAo5 != null && (
          <div>Best ao5: <span className="font-mono">{fmtTime(bestAo5)}</span></div>
        )}
        {bestAo12 != null && (
          <div>Best ao12: <span className="font-mono">{fmtTime(bestAo12)}</span></div>
        )}
        <div className="mt-1 border-t border-white/10 pt-1">
          Solves: {count}{dnf != null && dnf > 0 ? ` (${dnf} DNF)` : ""}
        </div>
        {std != null && (
          <div>Std dev: <span className="font-mono">{fmtTime(std)}</span></div>
        )}
        {cv != null && (
          <div>CV: <span className="font-mono">{(cv * 100).toFixed(1)}%</span></div>
        )}
      </div>
      {(rankLabel || deltaText) && (
        <div className="mt-1.5 border-t border-white/10 pt-1">
          {rankLabel && <div className="font-medium">{rankLabel}</div>}
          {deltaText && <div className="opacity-70">{deltaText}</div>}
        </div>
      )}
    </div>
  );
}

function fmtDay(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(ms);
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
  const [theme, setTheme] = useState<Theme>("dark");
  const [palette, setPalette] = useState<ChartPalette | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTheme(readStoredTheme() === "system" ? systemTheme() : ((document.documentElement.dataset.theme as Theme) || "dark"));
  }, []);

  useLayoutEffect(() => {
    setPalette(readChartPalette());
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((t) => {
      const nt = nextTheme(t);
      applyTheme(nt);
      return nt;
    });
  }, []);

  const loadFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCstimerExport(text);
      if (parsed.sessions.length === 0) throw new Error("no sessions found");
      setData(parsed);
      setFileName(file.name);
      setError(null);
      setSelectedType(pickDefaultType(parsed));
      setOverrides({});
      setRange("all");
    } catch {
      setError("Could not parse that file. Export again from cstimer: Options → Export (.txt).");
    }
  }, []);

  const effectiveType = useCallback(
    (s: ParsedSession): PuzzleType => effectiveTypeOf(s, overrides),
    [overrides],
  );

  const derived = useMemo(() => {
    if (!data) return null;
    return computeDashboardModel(data, { overrides, selectedType, range, bucket, horizonWeeks: horizon });
  }, [data, overrides, selectedType, range, bucket, horizon]);

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle theme={theme} onCycle={cycleTheme} />
        </div>
        <CubeHero />
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">
          cstimer{" "}
          <span className="bg-gradient-to-r from-[var(--cube-red)] via-[var(--cube-yellow)] to-[var(--cube-blue)] bg-clip-text text-transparent">
            analyzer
          </span>
        </h1>
        <p className="mb-8 text-sm text-[var(--text-dim)]">
          Upload a cstimer export. It will be graded without mercy.
        </p>
        <div
          className={`card w-full cursor-pointer border-2 border-dashed p-12 text-center transition-colors ${
            dragging ? "border-[var(--cube-yellow)]" : "border-[var(--border)] hover:border-[var(--cube-green)]"
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
          <p className="text-[var(--text)]">Drop your cstimer .txt export here</p>
          <p className="mt-1 text-xs text-[var(--text-faint)]">or click to browse — nothing leaves your machine</p>
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
        {error && <p className="mt-4 text-sm text-[var(--series-proj)]">{error}</p>}
      </main>
    );
  }

  const d = derived!;
  const a = d.analysis;
  const subscoreBar = (
    label: string,
    score: number | null,
    weight: string,
    axisClass: string,
  ) => (
    <div className={axisClass}>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium" style={{ color: "var(--axis-text)" }}>
          {label}
        </span>
        <span className="text-[var(--text-dim)]">
          {score != null ? `${score}/100` : "n/a"}{" "}
          <span className="text-xs text-[var(--text-faint)]">({weight})</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score ?? 0}%`, background: "var(--axis)" }}
        />
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            cstimer{" "}
            <span className="bg-gradient-to-r from-[var(--cube-red)] via-[var(--cube-yellow)] to-[var(--cube-blue)] bg-clip-text text-transparent">
              analyzer
            </span>
          </h1>
          <p className="text-xs text-[var(--text-faint)]">
            {fileName} · everything analyzed locally in your browser
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="card px-3 py-2 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
            onClick={() => {
              setData(null);
              setError(null);
            }}
          >
            Change file
          </button>
          <ThemeToggle theme={theme} onCycle={cycleTheme} />
        </div>
      </header>

      <section className="mb-6 flex flex-wrap items-end gap-4">
        {[
          { label: "Event", value: selectedType, set: setSelectedType, options: d.typeOptions.map((t) => ({ v: t.label, l: `${t.label} (${t.count} solves)` })) },
          { label: "Range", value: range, set: (v: string) => setRange(v as RangeKey), options: [{ v: "all", l: "All time" }, { v: "90", l: "Last 90 days" }, { v: "30", l: "Last 30 days" }, { v: "7", l: "Last 7 days" }] },
          { label: "Volume buckets", value: bucket, set: (v: string) => setBucket(v as BucketMode), options: [{ v: "day", l: "Daily" }, { v: "week", l: "Weekly" }] },
          { label: "Projection horizon", value: String(horizon), set: (v: string) => setHorizon(Number(v)), options: [{ v: "1", l: "+1 week" }, { v: "2", l: "+2 weeks" }, { v: "4", l: "+4 weeks" }, { v: "8", l: "+8 weeks" }] },
        ].map((sel) => (
          <label key={sel.label} className="flex flex-col gap-1 text-xs text-[var(--text-dim)]">
            {sel.label}
            <select
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
              value={sel.value}
              onChange={(e) => sel.set(e.target.value)}
            >
              {sel.options.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Solves in range", String(d.clean.length)],
          ["DNFs in range", String(d.dnfInRange)],
          ["Abandoned ignored", String(d.junkCount)],
          ["Current level", d.analysis.currentLevelMs != null ? fmtTime(d.analysis.currentLevelMs) : "—"],
          ["Best single", d.bestSingleMs != null ? fmtTime(d.bestSingleMs) : "—"],
          ["Active days / 14", `${d.analysis.freq.activeDays} @ ${d.analysis.freq.solvesPerActiveDay.toFixed(0)}/d`],
        ].map(([k, v], i) => (
          <div
            key={k}
            className="stat-chip p-3 pl-4"
            style={{ "--chip": `var(--chip${i + 1})`, "--chip-ink": `var(--ink${i + 1})` } as React.CSSProperties}
          >
            <div className="chip-label text-[11px] uppercase tracking-wide">{k}</div>
            <div className="mt-1 font-mono text-lg">{v}</div>
          </div>
        ))}
      </section>

      <section className="card mb-6 overflow-hidden p-0">
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--cube-red) 0 16.6%, var(--cube-orange) 0 33.2%, var(--cube-yellow) 0 49.8%, var(--cube-green) 0 66.4%, var(--cube-blue) 0 83%, var(--cube-white) 0 100%)",
          }}
        />
        <div className="p-4">
          {palette && (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={d.chartRows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={palette.grid} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={fmtDay}
                stroke={palette.tick}
                fontSize={11}
              />
              <YAxis
                yAxisId="time"
                domain={["auto", "auto"]}
                tickFormatter={(ms: number) => fmtTime(ms)}
                stroke={palette.tick}
                fontSize={11}
                width={64}
              />
              <YAxis yAxisId="vol" orientation="right" stroke={palette.volume} fontSize={11} width={32} />
              <Tooltip
                content={<SessionTooltip palette={palette} />}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: palette.tick }} />
              <Bar yAxisId="vol" dataKey="vol" name="Solves" fill={palette.volume} opacity={0.5} barSize={14} />
              <Scatter yAxisId="time" dataKey="sessionMean" name="Session" fill={palette.raw} shape={(props: any) => sessionDot({ ...props, palette })}>
                <ErrorBar dataKey="errorBar" width={4} strokeWidth={1} stroke={palette.tick} opacity={0.4} />
              </Scatter>
              <Line yAxisId="time" type="linear" dataKey="ao5" name="ao5 (sessions)" stroke={palette.ao5} dot={false} strokeWidth={1} />
              <Line yAxisId="time" type="linear" dataKey="ao12" name="ao12 (sessions)" stroke={palette.ao12} dot={false} strokeWidth={1.5} />
              <Line yAxisId="time" type="linear" dataKey="ao100" name="ao100 (sessions)" stroke={palette.ao100} dot={false} strokeWidth={2.5} />
              <Line yAxisId="time" type="linear" dataKey="trend" name="Trend" stroke={palette.trend} dot={false} strokeWidth={2} />
              <Line
                yAxisId="time"
                type="linear"
                dataKey="proj"
                name="Projection"
                stroke={palette.proj}
                strokeDasharray="6 4"
                dot={false}
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
          )}
          <p className="mt-1 text-center text-[11px] text-[var(--text-faint)]">
            each dot is a session — bigger = more solves, greener = more consistent
          </p>
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-5">
        <div className="card panel-solid panel-green p-5 lg:col-span-2">
          <div className="panel-muted text-[11px] uppercase tracking-wide">Headline score</div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-6xl font-bold" style={{ color: theme === "sticker" ? "#fff" : TIER_COLOR[a.tier ?? "bad"] }}>
              {a.headline ?? "—"}
            </span>
            <span className="panel-muted">/100</span>
          </div>
          <div className="mt-3 space-y-3 rounded-xl bg-black/15 p-3">
            {subscoreBar("Improvement", a.subscores.improvement, "40%", "axis-improvement")}
            {subscoreBar("Consistency", a.subscores.consistency, "30%", "axis-consistency")}
            {subscoreBar("Frequency", a.subscores.frequency, "30%", "axis-frequency")}
          </div>
        </div>
        <div className="card panel-solid panel-white flex flex-col justify-center p-5 lg:col-span-3">
          {a.tier && <span className={`tier-pill tier-pill-${a.tier} w-fit`}>{d.report.verdictTitle.split(".")[0]}</span>}
          <p className="panel-muted mt-3 text-sm leading-relaxed">{d.report.verdictText}</p>
          {d.projSentence && (
            <p className="mt-3 rounded-md border border-black/10 bg-black/5 p-3 text-sm leading-relaxed">{d.projSentence}</p>
          )}
        </div>
      </section>

      <section className="mb-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-dim)]">
          Where you are losing points — worst first, prescriptions included
        </h2>
        {d.report.splitHint && (
          <p className="card px-4 py-2 text-xs text-[var(--text-faint)]">{d.report.splitHint}</p>
        )}
        {d.report.focus.map((f, i) => {
          const isWeak = Boolean(f.prescription);
          const axisClass =
            f.area === "Improvement"
              ? "axis-improvement"
              : f.area === "Consistency"
                ? "axis-consistency"
                : f.area === "Frequency"
                  ? "axis-frequency"
                  : "";
          const panelClass = isWeak && AXIS_PANEL[f.area] ? `panel-solid ${AXIS_PANEL[f.area]}` : "";
          return (
            <div key={f.area} className={`card p-4 ${axisClass} ${panelClass}`}>
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold" style={!isWeak && f.area !== "Data" ? { color: "var(--axis-text)" } : undefined}>
                  {f.area}
                </span>
                {f.score != null && (
                  <span className="rounded-full bg-black/20 px-2 py-0.5 font-mono text-xs text-white">
                    {f.score}/100
                  </span>
                )}
                {isWeak && i === 0 && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
                    weakest — full prescription
                  </span>
                )}
              </div>
              <p className={`text-sm leading-relaxed ${isWeak ? "" : "text-[var(--text-dim)]"} panel-muted`}>{f.text}</p>
              {f.prescription && (
                <div className="mt-3 space-y-3">
                  <p className="text-sm font-medium">{f.prescription.diagnosis}</p>
                  <ol className="space-y-2">
                    {f.prescription.drills.map((drill) => (
                      <li key={drill.name} className="rounded-lg bg-black/15 p-3">
                        <div className="text-sm font-semibold">{drill.name}</div>
                        <div className="mt-0.5 text-xs leading-relaxed opacity-80">{drill.why}</div>
                      </li>
                    ))}
                  </ol>
                  {f.prescription.estimate && (
                    <p className="rounded-md bg-white/10 p-3 text-xs leading-relaxed">
                      <span className="font-semibold uppercase tracking-wide">The math:</span>{" "}
                      {f.prescription.estimate}
                      <span className="ml-2 rounded bg-black/25 px-1.5 py-0.5 text-[10px] uppercase">
                        {f.prescription.leverage} leverage
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <details className="card p-4 text-sm">
        <summary className="cursor-pointer text-[var(--text-dim)]">
          Sessions ({data.sessions.length}) — fix auto-detected event types here
        </summary>
        <div className="mt-3 divide-y divide-[var(--border)]">
          {data.sessions.map((s) => (
            <div key={s.meta.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <span className="w-20 font-mono text-xs text-[var(--text-faint)]">{s.meta.key}</span>
              <span className="min-w-40 flex-1 truncate text-xs text-[var(--text-dim)]">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                  timeZone: "UTC",
                }).format(s.meta.firstDateSec * 1000)}{" "}
                · {s.meta.solveCount} solves
              </span>
              <span className="text-xs text-[var(--text-faint)]">{s.typeSource}</span>
              <select
                className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)]"
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
