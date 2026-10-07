"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ParsedSession, Solve } from "@/lib/types";
import { fmtTime } from "@/lib/stats";
import {
  computeHistogram,
  computeTimeOfDay,
  compareSessions,
  type SessionComparisonItem,
} from "@/lib/analytics";

interface AnalyticsViewsProps {
  cleanSolves: Solve[];
  sessions: ParsedSession[];
  puzzleType: string;
}

export function HistogramSection({ times }: { times: number[] }) {
  const result = useMemo(() => computeHistogram(times), [times]);

  if (!result || result.bins.length === 0) {
    return (
      <div className="card p-4 text-xs text-[var(--text-dim)]">
        At least 3 clean solves required for solve-time distribution.
      </div>
    );
  }

  const { bins, meanMs, medianMs, stdDevMs, minMs, maxMs } = result;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text)]">
            Solve-Time Distribution
          </h3>
          <p className="text-[11px] text-[var(--text-dim)]">
            Histogram with theoretical normal distribution overlay
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--text-dim)]">
          <span>Min: <b className="text-[var(--text)]">{fmtTime(minMs)}</b></span>
          <span>Median: <b className="text-[var(--amber)]">{fmtTime(medianMs)}</b></span>
          <span>Mean: <b className="text-[var(--text)]">{fmtTime(meanMs)}</b></span>
          <span>Max: <b className="text-[var(--text)]">{fmtTime(maxMs)}</b></span>
          <span>Std Dev: <b className="text-[var(--text)]">{(stdDevMs / 1000).toFixed(2)}s</b></span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={bins} margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
            <XAxis
              dataKey="label"
              stroke="var(--text-faint)"
              fontSize={10}
              interval="preserveStartEnd"
              tickLine={false}
            />
            <YAxis
              yAxisId="count"
              stroke="var(--text-faint)"
              fontSize={10}
              allowDecimals={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded border border-[var(--border)] bg-[var(--surface-2)] p-2 text-xs shadow-xl">
                    <div className="font-semibold text-[var(--text)]">{d.label}</div>
                    <div className="text-sky-400">Solves: {d.count}</div>
                    <div className="text-[var(--amber)]">Expected Normal: {d.normalCount}</div>
                  </div>
                );
              }}
            />
            <Bar yAxisId="count" dataKey="count" fill="var(--chip2)" radius={[3, 3, 0, 0]} opacity={0.8} />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="normalCount"
              stroke="var(--amber)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TimeOfDaySection({ solves }: { solves: Solve[] }) {
  const result = useMemo(() => computeTimeOfDay(solves), [solves]);

  const activeHours = result.hours.filter((h) => h.solveCount > 0);
  if (activeHours.length === 0) {
    return (
      <div className="card p-4 text-xs text-[var(--text-dim)]">
        No solves recorded for time-of-day analysis.
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text)]">
            Time-of-Day Performance
          </h3>
          <p className="text-[11px] text-[var(--text-dim)]">
            Median solve time and activity by hour (local time)
          </p>
        </div>
        {result.peakLabel && (
          <div className="rounded bg-[var(--green)]/15 px-2.5 py-1 text-xs font-medium text-[var(--green)]">
            Peak Window: {result.peakLabel}
          </div>
        )}
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={result.hours} margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
            <XAxis dataKey="label" stroke="var(--text-faint)" fontSize={10} tickLine={false} />
            <YAxis
              yAxisId="time"
              domain={["auto", "auto"]}
              tickFormatter={(ms) => (ms != null ? fmtTime(ms) : "")}
              stroke="var(--amber)"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              yAxisId="vol"
              orientation="right"
              stroke="var(--text-faint)"
              fontSize={10}
              allowDecimals={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded border border-[var(--border)] bg-[var(--surface-2)] p-2 text-xs shadow-xl">
                    <div className="font-semibold text-[var(--text)]">{d.label}</div>
                    <div className="text-[var(--text-dim)]">Solves: {d.solveCount}</div>
                    {d.medianMs !== null && (
                      <div className="text-[var(--amber)]">Median: {fmtTime(d.medianMs)}</div>
                    )}
                    {d.meanMs !== null && (
                      <div className="text-[var(--text)]">Mean: {fmtTime(d.meanMs)}</div>
                    )}
                  </div>
                );
              }}
            />
            <Bar yAxisId="vol" dataKey="solveCount" fill="var(--surface-3)" radius={[2, 2, 0, 0]} />
            <Line
              yAxisId="time"
              type="monotone"
              dataKey="medianMs"
              stroke="var(--amber)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--amber)" }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SessionComparisonSection({
  sessions,
  puzzleType,
}: {
  sessions: ParsedSession[];
  puzzleType: string;
}) {
  const matching = useMemo(
    () => sessions.filter((s) => s.puzzleType === puzzleType),
    [sessions, puzzleType],
  );

  const items = useMemo(() => compareSessions(matching), [matching]);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    // Default to selecting all sessions (up to 6)
    return new Set(items.slice(0, 6).map((it) => it.key));
  });

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const displayed = items.filter((it) => selectedKeys.has(it.key));

  if (items.length < 2) {
    return (
      <div className="card p-4 text-xs text-[var(--text-dim)]">
        At least 2 sessions of {puzzleType} required for side-by-side comparison.
      </div>
    );
  }

  // Find best values among displayed
  const minMean = Math.min(...displayed.map((d) => d.meanMs ?? Infinity));
  const minMedian = Math.min(...displayed.map((d) => d.medianMs ?? Infinity));
  const minSingle = Math.min(...displayed.map((d) => d.bestSingleMs ?? Infinity));
  const minAo5 = Math.min(...displayed.map((d) => d.bestAo5Ms ?? Infinity));
  const minAo12 = Math.min(...displayed.map((d) => d.bestAo12Ms ?? Infinity));
  const minCv = Math.min(...displayed.map((d) => d.rCv ?? Infinity));

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text)]">
            Session Comparison ({puzzleType})
          </h3>
          <p className="text-[11px] text-[var(--text-dim)]">
            Side-by-side performance comparison across sessions
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => toggleKey(it.key)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                selectedKeys.has(it.key)
                  ? "bg-[var(--amber)] text-black"
                  : "bg-[var(--surface-2)] text-[var(--text-dim)] hover:bg-[var(--surface-3)]"
              }`}
            >
              {it.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-faint)] uppercase text-[10px]">
              <th className="py-2 pr-3 font-semibold">Session</th>
              <th className="py-2 px-3 font-semibold text-right">Solves</th>
              <th className="py-2 px-3 font-semibold text-right">Mean</th>
              <th className="py-2 px-3 font-semibold text-right">Median</th>
              <th className="py-2 px-3 font-semibold text-right">Best Single</th>
              <th className="py-2 px-3 font-semibold text-right">Best Ao5</th>
              <th className="py-2 px-3 font-semibold text-right">Best Ao12</th>
              <th className="py-2 pl-3 font-semibold text-right">rCV (MAD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {displayed.map((it) => (
              <tr key={it.key} className="hover:bg-[var(--surface-2)] transition-colors">
                <td className="py-2.5 pr-3 font-medium text-[var(--text)]">
                  {it.name}
                  {it.dnfCount > 0 && (
                    <span className="ml-1 text-[10px] text-red-400">({it.dnfCount} DNF)</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-[var(--text-dim)]">
                  {it.solveCount}
                </td>
                <td
                  className={`py-2.5 px-3 text-right font-mono ${
                    it.meanMs === minMean ? "text-[var(--green)] font-bold" : "text-[var(--text)]"
                  }`}
                >
                  {it.meanMs ? fmtTime(it.meanMs) : "-"}
                </td>
                <td
                  className={`py-2.5 px-3 text-right font-mono ${
                    it.medianMs === minMedian ? "text-[var(--green)] font-bold" : "text-[var(--text)]"
                  }`}
                >
                  {it.medianMs ? fmtTime(it.medianMs) : "-"}
                </td>
                <td
                  className={`py-2.5 px-3 text-right font-mono ${
                    it.bestSingleMs === minSingle ? "text-[var(--green)] font-bold" : "text-[var(--text)]"
                  }`}
                >
                  {it.bestSingleMs ? fmtTime(it.bestSingleMs) : "-"}
                </td>
                <td
                  className={`py-2.5 px-3 text-right font-mono ${
                    it.bestAo5Ms === minAo5 ? "text-[var(--green)] font-bold" : "text-[var(--text)]"
                  }`}
                >
                  {it.bestAo5Ms ? fmtTime(it.bestAo5Ms) : "-"}
                </td>
                <td
                  className={`py-2.5 px-3 text-right font-mono ${
                    it.bestAo12Ms === minAo12 ? "text-[var(--green)] font-bold" : "text-[var(--text)]"
                  }`}
                >
                  {it.bestAo12Ms ? fmtTime(it.bestAo12Ms) : "-"}
                </td>
                <td
                  className={`py-2.5 pl-3 text-right font-mono ${
                    it.rCv === minCv ? "text-[var(--green)] font-bold" : "text-[var(--text-dim)]"
                  }`}
                >
                  {it.rCv ? `${(it.rCv * 100).toFixed(1)}%` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnalyticsViews({
  cleanSolves,
  sessions,
  puzzleType,
}: AnalyticsViewsProps) {
  const times = useMemo(() => cleanSolves.map((s) => s.timeMs), [cleanSolves]);

  return (
    <div className="space-y-4 my-5">
      <HistogramSection times={times} />
      <TimeOfDaySection solves={cleanSolves} />
      <SessionComparisonSection sessions={sessions} puzzleType={puzzleType} />
    </div>
  );
}
